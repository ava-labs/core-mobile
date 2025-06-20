import { useCallback, useEffect, useState } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs'
import WalletService from 'services/wallet/WalletService'
import { stripChainAddress } from 'store/account/utils'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useGetFeeState } from 'hooks/earn/useGetFeeState'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { assertNotUndefined } from 'utils/assertions'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
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

  const createSendPTx = useCallback(
    async (amountInNAvax: bigint, price?: bigint): Promise<UnsignedTx> => {
      assertNotUndefined(network)

      const destinationAddress = 'P-' + stripChainAddress(addressToSend ?? '')
      return await WalletService.createSendPTx({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index,
        amountInNAvax,
        avaxXPNetwork: network,
        destinationAddress: destinationAddress,
        sourceAddress: fromAddress,
        feeState: getFeeState(price)
      })
    },
    [addressToSend, account.index, network, fromAddress, getFeeState, wallet]
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
        accountIndex: account.index,
        amountInNAvax: amount.toSubUnit(),
        toAddress: addressToSend,
        feeState: getFeeState(gasPrice)
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
    account.index,
    getFeeState,
    gasPrice,
    wallet
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

  // TODO: use correct max amount for P-chain
  const getMaxAmount = useCallback(async () => {
    if (!selectedToken || !isTokenWithBalancePVM(selectedToken)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

    const balance = selectedToken.available ?? 0n
    const maxAmountValue = balance - fee
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n

    return new TokenUnit(
      maxAmount,
      selectedToken.decimals,
      selectedToken.symbol
    )
  }, [maxFee, selectedToken])

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
