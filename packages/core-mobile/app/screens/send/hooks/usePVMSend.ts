import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { assertNotUndefined } from 'utils/assertions'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { SendAdapterPVM, SendErrorMessage } from '../utils/types'
import { send as sendPVM } from '../utils/pvm/send'
import { validate as validatePVMSend } from '../utils/pvm/validate'

const usePVMSend: SendAdapterPVM = ({
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
    token,
    toAddress,
    amount,
    canValidate
  } = useSendContext()

  const send = useCallback(async () => {
    try {
      assertNotUndefined(toAddress)
      assertNotUndefined(token)
      assertNotUndefined(amount)

      setIsSending(true)

      return await sendPVM({
        request,
        fromAddress,
        account,
        network,
        toAddress,
        amount: amount.bn
      })
    } finally {
      setIsSending(false)
    }
  }, [
    request,
    fromAddress,
    network,
    account,
    setIsSending,
    toAddress,
    amount,
    token
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
    try {
      validatePVMSend({
        amount: amount?.bn ?? 0n,
        address: toAddress,
        maxFee,
        token: token as TokenWithBalancePVM
      })

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [maxFee, setError, handleError, token, toAddress, amount])

  const getMaxAmount = useCallback(async () => {
    if (!token || !isTokenWithBalancePVM(token)) {
      return
    }

    const fee = maxFee ? BigInt(GAS_LIMIT_FOR_XP_CHAIN) * maxFee : 0n

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

export default usePVMSend
