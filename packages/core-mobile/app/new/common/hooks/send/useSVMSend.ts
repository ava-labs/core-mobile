import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSendContext } from 'features/send/context/sendContext'
import { useCallback } from 'react'
import { assertNotUndefined } from 'utils/assertions'
import { useSendSelectedToken } from 'features/send/store'
import { useSVMProvider } from 'hooks/networks/networkProviderHooks'
import { SendAdapterSVM } from './utils/types'
import { validateSupportedToken } from './utils/svm/validate'
import { send as sendSVM } from './utils/svm/send'

const useSVMSend: SendAdapterSVM = ({
  fromAddress,
  network,
  maxFee,
  nativeToken
}) => {
  const { request } = useInAppRequest()

  const { setIsSending, addressToSend, amount } = useSendContext()

  const [selectedToken] = useSendSelectedToken()
  const provider = useSVMProvider(network)

  const send = useCallback(async () => {
    try {
      assertNotUndefined(selectedToken)
      assertNotUndefined(addressToSend)
      assertNotUndefined(provider)
      assertNotUndefined(network)
      validateSupportedToken(selectedToken)
      setIsSending(true)

      console.log('network', network.chainId)

      return await sendSVM({
        request,
        fromAddress,
        provider,
        token: selectedToken,
        toAddress: addressToSend,
        amount: amount?.toSubUnit(),
        chainId: network.chainId
      })
    } finally {
      setIsSending(false)
    }
  }, [
    selectedToken,
    addressToSend,
    provider,
    network,
    setIsSending,
    request,
    fromAddress,
    amount
  ])

  return {
    maxAmount: undefined,
    error: undefined,
    isSending: false,
    canValidate: false,
    send
  }
}

export default useSVMSend
