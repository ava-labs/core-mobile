import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { assertNotUndefined } from 'utils/assertions'
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
    setIsValidating,
    token,
    toAddress,
    amount
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
    setIsValidating(true)
    setError(undefined)

    try {
      validatePVMSend({
        amount: amount?.bn ?? 0n,
        address: toAddress,
        maxFee,
        token: token as TokenWithBalancePVM,
        onCalculateMaxAmount: setMaxAmount
      })
    } catch (err) {
      handleError(err)
    } finally {
      setIsValidating(false)
    }
  }, [
    maxFee,
    setMaxAmount,
    setError,
    handleError,
    setIsValidating,
    token,
    toAddress,
    amount
  ])

  useEffect(() => {
    validate()
  }, [validate])

  return {
    send
  }
}

export default usePVMSend
