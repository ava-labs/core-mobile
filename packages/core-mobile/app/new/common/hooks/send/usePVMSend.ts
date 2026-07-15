import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFilterSmallUtxosActive } from 'store/settings/advanced/filterSmallUtxosActive'
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
  const filterSmallUtxos = useSelector(selectIsFilterSmallUtxosActive)

  // CP-13903: with the small-UTXO filter on, the displayed balance can
  // include dust the send tx builder will refuse to spend (and the
  // VM-module balance fallback never filters), so Max and validation must
  // use the spendable balance from the same filtered UTXO set
  // createSendPTx consumes.
  const [spendableBalance, setSpendableBalance] = useState<bigint>()

  useEffect(() => {
    // Any dep change means the previous value may describe a different
    // account/network/fee state — drop it so Max/validation never gate on
    // a stale balance while the refetch is in flight.
    setSpendableBalance(undefined)
    // P needs a loaded feeState: getMaximumUtxoSet builds txs to measure
    // size, and an undefined feeState makes every build fail — the "capped"
    // set comes back empty and Max/validation would gate on a bogus 0.
    // getFeeState's identity changes when defaults load, re-firing this.
    const feeState = getFeeState(gasPrice)
    if (!filterSmallUtxos || network === undefined || feeState === undefined) {
      return
    }
    let cancelled = false
    AvalancheWalletService.getSpendableAvaxBalance({
      chain: 'P',
      account,
      isTestnet: Boolean(network.isTestnet),
      xpAddresses,
      feeState,
      filterSmallUtxos
    })
      .then(balance => {
        if (!cancelled) setSpendableBalance(balance)
      })
      .catch(Logger.error)
    return () => {
      cancelled = true
    }
  }, [filterSmallUtxos, network, account, xpAddresses, getFeeState, gasPrice])

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
        xpAddresses,
        filterSmallUtxos
      })
    },
    [
      addressToSend,
      account,
      network,
      fromAddress,
      getFeeState,
      xpAddresses,
      filterSmallUtxos
    ]
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
        xpAddressDictionary,
        filterSmallUtxos
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
    xpAddressDictionary,
    filterSmallUtxos
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
        estimatedFee,
        // While the spendable balance is loading (or if its fetch failed),
        // this is undefined and validation deliberately degrades to the
        // displayed balance — same as pre-filter behavior: worst case the
        // send fails at build instead of validation. Max (getMaxAmount)
        // never degrades this way.
        spendableBalance: filterSmallUtxos ? spendableBalance : undefined
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
    handleError,
    filterSmallUtxos,
    spendableBalance
  ])

  // P-Chain uses dynamic fees
  // We can simulate a transaction to get the exact fee necessary
  // But we get the fee amount as an error string and we have to extract it and then subtract it from balance
  // Conservative solution: estimate as 1% of balance
  const getMaxAmount = useCallback(async () => {
    if (!selectedToken || !isTokenWithBalancePVM(selectedToken)) {
      return
    }

    // With the filter on, wait for the spendable balance — a Max derived
    // from the dust-inclusive displayed balance would build an over-spend.
    const balance = filterSmallUtxos
      ? spendableBalance
      : selectedToken.available ?? 0n
    if (balance === undefined) {
      return
    }
    const estimatedFeePercent = balance / 100n
    const maxAmountValue = balance - estimatedFeePercent
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n

    return new TokenUnit(
      maxAmount,
      selectedToken.decimals,
      selectedToken.symbol
    )
  }, [selectedToken, filterSmallUtxos, spendableBalance])

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
