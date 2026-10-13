import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsFilterSmallUtxosActive } from 'store/settings/advanced/filterSmallUtxosActive'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { assertNotUndefined } from 'utils/assertions'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { isTokenWithBalanceAVM } from '@avalabs/avalanche-module'
import Logger from 'utils/Logger'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { SendAdapterAVM, SendErrorMessage } from './utils/types'
import { send as sendAVM } from './utils/avm/send'
import { validate as validateAVMSend } from './utils/avm/validate'

const useAVMSend: SendAdapterAVM = ({
  network,
  maxFee,
  account,
  fromAddress
}) => {
  const { request } = useInAppRequest()
  const {
    setMaxAmount,
    setError,
    setIsSending,
    amount,
    addressToSend,
    canValidate
  } = useSendContext()
  const [selectedToken] = useSendSelectedToken()
  const { xpAddresses, xpAddressDictionary } = useXPAddresses(account)
  const filterSmallUtxos = useSelector(selectIsFilterSmallUtxosActive)

  // CP-13903: the Balance API only honors the dust filter on P-Chain, so
  // the displayed X balance stays dust-inclusive while createSendXTx
  // filters its spend set. Max and validation must use the spendable
  // balance derived from the same filtered UTXO set instead.
  const [spendableBalance, setSpendableBalance] = useState<bigint>()

  useEffect(() => {
    // Any dep change means the previous value may describe a different
    // account/network — drop it so Max/validation never gate on a stale
    // balance while the refetch is in flight.
    setSpendableBalance(undefined)
    if (!filterSmallUtxos || network === undefined) {
      return
    }
    let cancelled = false
    AvalancheWalletService.getSpendableAvaxBalance({
      chain: 'X',
      account,
      isTestnet: Boolean(network.isTestnet),
      xpAddresses,
      filterSmallUtxos
    })
      .then(balance => {
        if (!cancelled) setSpendableBalance(balance)
      })
      .catch(Logger.error)
    return () => {
      cancelled = true
    }
  }, [filterSmallUtxos, network, account, xpAddresses])

  const tokenProps = useMemo(() => {
    if (!selectedToken || !isTokenWithBalanceAVM(selectedToken)) {
      return { decimals: undefined, symbol: undefined }
    }
    return { decimals: selectedToken.decimals, symbol: selectedToken.symbol }
  }, [selectedToken])

  const send = useCallback(async () => {
    try {
      assertNotUndefined(addressToSend)
      assertNotUndefined(amount)
      assertNotUndefined(network)

      setIsSending(true)

      return await sendAVM({
        request,
        fromAddress,
        account,
        network,
        toAddress: addressToSend,
        amount: amount.toSubUnit(),
        xpAddresses,
        xpAddressDictionary,
        filterSmallUtxos
      })
    } finally {
      setIsSending(false)
    }
  }, [
    addressToSend,
    amount,
    network,
    setIsSending,
    request,
    fromAddress,
    account,
    xpAddresses,
    xpAddressDictionary,
    filterSmallUtxos
  ])

  const handleError = useCallback(
    (err: unknown) => {
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
      validateAVMSend({
        amount: amount?.toSubUnit(),
        address: addressToSend,
        maxFee,
        token: selectedToken as TokenWithBalanceAVM,
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
    maxFee,
    setError,
    handleError,
    addressToSend,
    amount,
    selectedToken,
    filterSmallUtxos,
    spendableBalance
  ])

  const getMaxAmount = useCallback(async () => {
    if (!selectedToken || !isTokenWithBalanceAVM(selectedToken)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

    // With the filter on, wait for the spendable balance — a Max derived
    // from the dust-inclusive displayed balance would build an over-spend.
    const balance = filterSmallUtxos
      ? spendableBalance
      : selectedToken.available ?? 0n
    if (balance === undefined) {
      return
    }
    const maxAmountValue = balance - fee
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n
    return new TokenUnit(
      maxAmount,
      selectedToken.decimals,
      selectedToken.symbol
    )
  }, [maxFee, selectedToken, filterSmallUtxos, spendableBalance])

  useEffect(() => {
    if (canValidate) {
      validate()
    }
  }, [validate, canValidate])

  useEffect(() => {
    getMaxAmount()
      .then(maxAmount => {
        if (maxAmount) {
          setMaxAmount(maxAmount)
        }
      })
      .catch(Logger.error)
  }, [getMaxAmount, tokenProps.decimals, tokenProps.symbol, setMaxAmount])

  return {
    send
  }
}

export default useAVMSend
