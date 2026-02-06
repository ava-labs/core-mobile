import { useCallback, useEffect, useState } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs'
import { stripChainAddress } from 'store/account/utils'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useGetFeeState } from 'hooks/earn/useGetFeeState'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { assertNotUndefined } from 'utils/assertions'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { SendAdapterPVM, SendErrorMessage } from './utils/types'
import { send as sendPVM } from './utils/pvm/send'
import { validate as validatePVMSend } from './utils/pvm/validate'

const usePVMSend: SendAdapterPVM = ({
  network,
  maxFee,
  account,
  fromAddress
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const { request } = useInAppRequest()
  const {
    setMaxAmount,
    setError,
    setIsSending,
    addressToSend,
    amount,
    canValidate
  } = useSendContext()
  const [gasPrice, setGasPrice] = useState<bigint>()
  const { getFeeState } = useGetFeeState()
  const [estimatedFee, setEstimatedFee] = useState<bigint>()
  const [selectedToken] = useSendSelectedToken()
  const provider = useAvalancheXpProvider()
  const wallet = useActiveWallet()
  const { xpAddresses, xpAddressDictionary } = useXPAddresses(account)

  const createSendPTx = useCallback(
    async (amountInNAvax: bigint, price?: bigint): Promise<UnsignedTx> => {
      assertNotUndefined(network)

      const destinationAddress = 'P-' + stripChainAddress(addressToSend ?? '')
      return await AvalancheWalletService.createSendPTx({
        account,
        amountInNAvax,
        isTestnet: Boolean(network.isTestnet),
        destinationAddress,
        sourceAddress: fromAddress,
        feeState: getFeeState(price),
        xpAddresses
      })
    },
    [addressToSend, account, network, fromAddress, getFeeState, xpAddresses]
  )

  useEffect(() => {
    const getEstimatedFee = async (): Promise<void> => {
      if (!addressToSend || !selectedToken || !amount) {
        return Promise.reject('missing required fields')
      }
      if (provider) {
        const unsignedTx = await createSendPTx(amount.toSubUnit(), maxFee)
        const tx = await Avalanche.parseAvalancheTx(
          unsignedTx,
          provider,
          fromAddress
        )
        setEstimatedFee(tx.txFee)
      }
    }
    getEstimatedFee().catch(Logger.error)
  }, [
    addressToSend,
    amount,
    createSendPTx,
    fromAddress,
    maxFee,
    provider,
    selectedToken,
    setError
  ])

  const send = useCallback(async () => {
    if (!addressToSend || !selectedToken || !amount || network === undefined) {
      return Promise.reject('missing required fields')
    }

    try {
      setIsSending(true)
      return await sendPVM({
        walletId: wallet.id,
        walletType: wallet.type,
        request,
        network,
        fromAddress,
        account,
        amountInNAvax: amount.toSubUnit(),
        toAddress: addressToSend,
        feeState: getFeeState(gasPrice),
        xpAddresses,
        xpAddressDictionary
      })
    } finally {
      setIsSending(false)
    }
  }, [
    addressToSend,
    selectedToken,
    amount,
    setIsSending,
    request,
    network,
    fromAddress,
    account,
    getFeeState,
    gasPrice,
    wallet,
    xpAddresses,
    xpAddressDictionary
  ])

  const handleError = useCallback(
    (err: unknown): void => {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(SendErrorMessage.UNKNOWN_ERROR)
      }
    },
    [setError]
  )

  const validate = useCallback(async () => {
    assertNotUndefined(maxFee)
    try {
      validatePVMSend({
        amount: amount?.toSubUnit() ?? 0n,
        address: addressToSend,
        maxFee,
        token: selectedToken as TokenWithBalancePVM,
        gasPrice,
        estimatedFee
      })

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [
    amount,
    addressToSend,
    maxFee,
    selectedToken,
    gasPrice,
    estimatedFee,
    setError,
    handleError
  ])

  // P-Chain uses dynamic fees
  // We can simulate a transaction to get the exact fee necessary
  // But we get the fee amount as an error string and we have to extract it and then subtract it from balance
  // Conservative solution: estimate as 1% of balance
  const getMaxAmount = useCallback(async () => {
    if (!selectedToken || !isTokenWithBalancePVM(selectedToken)) {
      return
    }

    const balance = selectedToken.available ?? 0n
    const estimatedFeePercent = balance / 100n
    const maxAmountValue = balance - estimatedFeePercent
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n

    return new TokenUnit(
      maxAmount,
      selectedToken.decimals,
      selectedToken.symbol
    )
  }, [selectedToken])

  useEffect(() => {
    if (canValidate) {
      validate()
    }
  }, [validate, canValidate])

  const decimals =
    selectedToken && 'decimals' in selectedToken
      ? selectedToken.decimals
      : undefined

  const symbol = selectedToken?.symbol

  useEffect(() => {
    getMaxAmount()
      .then(maxAmount => {
        if (maxAmount) {
          setMaxAmount(maxAmount)
        }
      })
      .catch(Logger.error)
  }, [getMaxAmount, decimals, symbol, setMaxAmount])

  return {
    send,
    provider,
    estimatedFee,
    setGasPrice
  }
}

export default usePVMSend
