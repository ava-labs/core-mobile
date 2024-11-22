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
    setIsSending,
    toAddress,
    token,
    amount,
    canValidate
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

    const maxAmountValue = BigInt(
      Math.max(
        getMaxTransferAmount(utxos, toAddress, fromAddress, Number(maxFee)),
        0
      )
    )

    try {
      validateBTCSend({
        toAddress,
        amount: amount?.bn ?? 0n,
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
    fromAddress,
    maxFee,
    utxos,
    isMainnet,
    setError,
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

  const getMaxAmount = useCallback(async () => {
    if (toAddress === undefined) {
      return undefined
    }
    const maxAmountValue = BigInt(
      Math.max(
        getMaxTransferAmount(utxos, toAddress, fromAddress, Number(maxFee)),
        0
      )
    )

    return {
      bn: maxAmountValue ?? 0n,
      amount: maxAmountValue
        ? bigIntToString(maxAmountValue, nativeToken.decimals)
        : ''
    }
  }, [maxFee, toAddress, fromAddress, nativeToken, utxos])

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
  }, [getMaxAmount, setMaxAmount])

  return {
    send
  }
}

export default useBTCSend
