import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { assertNotUndefined } from 'utils/assertions'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import { isTokenWithBalanceAVM } from '@avalabs/avalanche-module'
import Logger from 'utils/Logger'
import { SendAdapterAVM, SendErrorMessage } from '../utils/types'
import { send as sendAVM } from '../utils/avm/send'
import { validate as validateAVMSend } from '../utils/avm/validate'

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
    token,
    toAddress,
    canValidate
  } = useSendContext()

  const send = useCallback(async () => {
    try {
      assertNotUndefined(toAddress)
      assertNotUndefined(amount)

      setIsSending(true)

      return await sendAVM({
        request,
        fromAddress,
        account,
        network,
        toAddress,
        amount: amount?.bn
      })
    } finally {
      setIsSending(false)
    }
  }, [request, fromAddress, network, account, setIsSending, toAddress, amount])

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
    try {
      validateAVMSend({
        amount: amount?.bn,
        address: toAddress,
        maxFee,
        token: token as TokenWithBalanceAVM
      })

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [maxFee, setError, handleError, toAddress, amount, token])

  const getMaxAmount = useCallback(async () => {
    if (!token || !isTokenWithBalanceAVM(token)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

    const balance = token.available ?? 0n
    const maxAmountValue = balance - fee
    const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n
    return {
      bn: maxAmount,
      amount: bigIntToString(maxAmount, token.decimals)
    }
  }, [maxFee, token])

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

export default useAVMSend
