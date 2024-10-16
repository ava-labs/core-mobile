import {
  BitcoinInputUTXO,
  getMaxTransferAmount
} from '@avalabs/core-wallets-sdk'
import { useCallback, useEffect, useState } from 'react'
import Logger from 'utils/Logger'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { assertNotUndefined } from 'utils/assertions'
import { useBitcoinProvider } from 'hooks/networks/networkProviderHooks'
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
    setIsValidating,
    setIsSending,
    toAddress,
    token,
    amount
  } = useSendContext()
  const provider = useBitcoinProvider(!!network.isTestnet)

  useEffect(() => {
    const fetchInputUtxos = async (): Promise<void> => {
      assertNotUndefined(provider)
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

  const validate = useCallback(async () => {
    if (!toAddress || !token) {
      return
    }

    setIsValidating(true)
    setError(undefined)

    try {
      const maxAmountValue = BigInt(
        Math.max(
          getMaxTransferAmount(utxos, toAddress, fromAddress, Number(maxFee)),
          0
        )
      )

      setMaxAmount({
        bn: maxAmountValue ?? 0n,
        amount: maxAmountValue
          ? bigIntToString(maxAmountValue, nativeToken.decimals)
          : ''
      })

      validateBTCSend({
        toAddress,
        amount: amount?.bn ?? 0n,
        maxAmount: maxAmountValue,
        maxFee,
        isMainnet
      })
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
        Logger.error('failed to validate send', e)
      }
    } finally {
      setIsValidating(false)
    }
  }, [
    fromAddress,
    maxFee,
    nativeToken,
    utxos,
    isMainnet,
    setMaxAmount,
    setError,
    setIsValidating,
    toAddress,
    token,
    amount
  ])

  const send = useCallback(async () => {
    try {
      assertNotUndefined(toAddress)
      assertNotUndefined(amount)

      setIsSending(true)

      return await sendBTC({
        request,
        toAddress,
        fromAddress,
        amount: amount?.bn,
        feeRate: maxFee,
        isMainnet
      })
    } finally {
      setIsSending(false)
    }
  }, [isMainnet, maxFee, fromAddress, request, setIsSending, toAddress, amount])

  useEffect(() => {
    validate()
  }, [validate])

  return {
    send
  }
}

export default useBTCSend
