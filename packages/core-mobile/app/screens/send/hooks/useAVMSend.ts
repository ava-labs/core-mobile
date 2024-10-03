import { useCallback, useEffect } from 'react'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'contexts/SendContext'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { assertNotUndefined } from 'utils/assertions'
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
    setIsValidating,
    setIsSending,
    amount,
    token,
    toAddress
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
    setIsValidating(true)
    setError(undefined)

    try {
      validateAVMSend({
        amount: amount?.bn,
        address: toAddress,
        maxFee,
        token: token as TokenWithBalanceAVM,
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
    toAddress,
    amount,
    token
  ])

  useEffect(() => {
    validate()
  }, [validate])

  return {
    send
  }
}

export default useAVMSend
