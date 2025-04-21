import { useDispatch, useSelector } from 'react-redux'
import useEVMSend from 'screens/send/hooks/useEVMSend'
import { selectActiveAccount } from 'store/account'
import { useNativeTokenWithBalance } from 'screens/send/hooks/useNativeTokenWithBalance'
import { useCallback } from 'react'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { showSnackbar } from 'common/utils/toast'
import { addRecentContact } from 'store/addressBook'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'

export const useSend = (): { handleSend: () => Promise<void> } => {
  const { network, maxFee, recipient } = useSendContext()
  const dispatch = useDispatch()
  const { canGoBack, back, dismissAll, dismiss } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)
  const nativeToken = useNativeTokenWithBalance(network)
  const [selectedToken, setSelectedToken] = useSendSelectedToken()

  const { send } = useEVMSend({
    chainId: network.chainId,
    fromAddress: activeAccount?.addressC ?? '',
    network,
    maxFee,
    nativeToken
  })

  const handleSuccess = useCallback(
    (txHash: string): void => {
      AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
        chainId: network.chainId,
        txHash
      })
      audioFeedback(Audios.Send)
      canGoBack() && back()
    },
    [network, canGoBack, back]
  )

  const handleFailure = useCallback(
    (error: unknown): void => {
      if (error instanceof Error && !isUserRejectedError(error)) {
        showSnackbar(getJsonRpcErrorMessage(error))
        AnalyticsService.capture('SendTransactionFailed', {
          errorMessage: error.message,
          chainId: network.chainId
        })
      }
    },
    [network?.chainId]
  )

  const handleSend = useCallback(async (): Promise<void> => {
    if (selectedToken === undefined) {
      return
    }

    try {
      const txHash = await send()

      handleSuccess(txHash)
      setSelectedToken(undefined)
      recipient &&
        'id' in recipient &&
        dispatch(addRecentContact({ id: recipient.id, type: 'account' }))
      dismissAll()
      dismiss()
    } catch (reason) {
      handleFailure(reason)
    }
  }, [
    selectedToken,
    send,
    handleSuccess,
    setSelectedToken,
    recipient,
    dispatch,
    dismissAll,
    dismiss,
    handleFailure
  ])

  return {
    handleSend
  }
}
