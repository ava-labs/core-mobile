import {
  BitcoinInputUTXO,
  getMaxTransferAmount
} from '@avalabs/core-wallets-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Logger from 'utils/Logger'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { assertNotUndefined } from 'utils/assertions'
import { useBitcoinProvider } from 'hooks/networks/networkProviderHooks'
import { useSendContext } from 'new/features/send/context/sendContext'
import { useSendSelectedToken } from 'new/features/send/store'
import { SendAdapterBTC } from '../utils/types'
import { getBtcInputUtxos } from '../utils/btc/getBtcInputUtxos'
import { send as sendBTC } from '../utils/btc/send'
import { validate as validateBTCSend } from '../utils/btc/validate'

const useBTCSend: SendAdapterBTC = ({
  isMainnet,
  fromAddress,
  maxFee,
  nativeToken,
  network
}) => {
  const [utxos, setUtxos] = useState<BitcoinInputUTXO[]>([])
  const { request } = useInAppRequest()
  const {
    setMaxAmount,
    setError,
    setIsSending,
    addressToSend,
    amount,
    canValidate
  } = useSendContext()
  const provider = useBitcoinProvider(!!network?.isTestnet)
  const [selectedToken] = useSendSelectedToken()

  useEffect(() => {
    const fetchInputUtxos = async (): Promise<void> => {
      assertNotUndefined(provider)
      assertNotUndefined(nativeToken)

      const inputUtxos = await getBtcInputUtxos(
        provider,
        nativeToken,
        Number(maxFee)
      )

      setUtxos(inputUtxos)
    }

    fetchInputUtxos()

    const intervalId = setInterval(
      () => fetchInputUtxos().catch(Logger.error),
      30000
    )

    return () => {
      clearInterval(intervalId)
    }
  }, [nativeToken, maxFee, provider])

  const maxAmountValue = useMemo(() => {
    if (!addressToSend) {
      return
    }

    return BigInt(
      Math.max(
        getMaxTransferAmount(utxos, addressToSend, fromAddress, Number(maxFee)),
        0
      )
    )
  }, [addressToSend, fromAddress, utxos, maxFee])

  const validate = useCallback(async () => {
    if (
      !addressToSend ||
      !selectedToken ||
      maxAmountValue === undefined ||
      maxFee === undefined
    ) {
      return
    }

    try {
      validateBTCSend({
        toAddress: addressToSend,
        amount: amount?.toSubUnit() ?? 0n,
        maxAmount: maxAmountValue,
        maxFee,
        isMainnet
      })

      setError(undefined)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
        Logger.error('failed to validate send', e)
      }
    }
  }, [
    maxFee,
    isMainnet,
    setError,
    addressToSend,
    selectedToken,
    amount,
    maxAmountValue
  ])

  const send = useCallback(async () => {
    try {
      assertNotUndefined(addressToSend)
      assertNotUndefined(amount)
      assertNotUndefined(maxFee)

      setIsSending(true)

      return await sendBTC({
        request,
        toAddress: addressToSend,
        fromAddress,
        amount: amount?.toSubUnit(),
        feeRate: maxFee,
        isMainnet
      })
    } finally {
      setIsSending(false)
    }
  }, [
    isMainnet,
    maxFee,
    fromAddress,
    request,
    setIsSending,
    addressToSend,
    amount
  ])

  useEffect(() => {
    if (canValidate) {
      validate()
    }
  }, [validate, canValidate])

  useEffect(() => {
    if (maxAmountValue !== undefined && nativeToken !== undefined) {
      setMaxAmount(
        new TokenUnit(maxAmountValue, nativeToken.decimals, nativeToken.symbol)
      )
    }
  }, [
    maxAmountValue,
    setMaxAmount,
    nativeToken?.decimals,
    nativeToken?.symbol,
    nativeToken
  ])

  return {
    send
  }
}

export default useBTCSend
