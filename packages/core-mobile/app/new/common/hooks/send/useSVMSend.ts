import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'features/send/context/sendContext'
import { useCallback, useEffect } from 'react'
import { assertNotUndefined } from 'utils/assertions'
import { useSendSelectedToken } from 'features/send/store'
import { useSVMProvider } from 'hooks/networks/networkProviderHooks'
import { SendAdapterSVM, SendErrorMessage } from './utils/types'
import { validateSupportedToken } from './utils/svm/validate'
import { send as sendSVM } from './utils/svm/send'

const useSVMSend: SendAdapterSVM = ({ fromAddress, network, account }) => {
  const { request } = useInAppRequest()

  const { setError, setIsSending, addressToSend, amount, canValidate } =
    useSendContext()

  const [selectedToken] = useSendSelectedToken()
  const provider = useSVMProvider(network)

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
      assertNotUndefined(selectedToken)
      validateSupportedToken(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(network)

      // Basic validation for SVM transactions
      if (!amount || amount.toSubUnit() <= 0n) {
        throw new Error(SendErrorMessage.AMOUNT_REQUIRED)
      }

      if (!addressToSend) {
        throw new Error(SendErrorMessage.ADDRESS_REQUIRED)
      }

      setError(undefined)
    } catch (err) {
      handleError(err)
    }
  }, [
    selectedToken,
    addressToSend,
    provider,
    network,
    amount,
    setError,
    handleError
  ])

  const send = useCallback(async () => {
    try {
      assertNotUndefined(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(network)
      validateSupportedToken(selectedToken)
      setIsSending(true)

      return await sendSVM({
        request,
        fromAddress,
        provider,
        token: selectedToken,
        toAddress: addressToSend,
        amount: amount?.toSubUnit(),
        chainId: network.chainId,
        account
      })
    } catch (error) {
      handleError(error)
      throw error
    } finally {
      setIsSending(false)
    }
  }, [
    selectedToken,
    addressToSend,
    provider,
    fromAddress,
    network,
    setIsSending,
    request,
    amount,
    handleError,
    account
  ])

  useEffect(() => {
    if (canValidate) {
      validate()
    }
  }, [validate, canValidate])

  return {
    maxAmount: undefined,
    error: undefined,
    isSending: false,
    canValidate: false,
    send
  }
}

export default useSVMSend
