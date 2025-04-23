import { showSnackbar } from 'common/utils/toast'
import { useSendSelectedToken } from 'features/send/store'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addRecentContact, Contact } from 'store/addressBook'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'

export const useSuccessOrFailure = (): {
  onSuccess: ({
    txHash,
    contact,
    onDismiss
  }: {
    txHash: string
    contact?: Contact
    onDismiss: () => void
  }) => void
  onFailure: (error: unknown) => void
} => {
  const [selectedToken, setSelectedToken] = useSendSelectedToken()
  const dispatch = useDispatch()

  const onSuccess = useCallback(
    ({
      txHash,
      contact,
      onDismiss
    }: {
      txHash: string
      contact?: Contact
      onDismiss: () => void
    }): void => {
      selectedToken &&
        AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
          chainId: selectedToken.networkChainId,
          txHash
        })
      audioFeedback(Audios.Send)
      setSelectedToken(undefined)
      contact?.type &&
        dispatch(addRecentContact({ id: contact.id, type: contact.type }))

      onDismiss()
    },
    [dispatch, selectedToken, setSelectedToken]
  )

  const onFailure = useCallback(
    (error: unknown): void => {
      if (error instanceof Error && !isUserRejectedError(error)) {
        showSnackbar(getJsonRpcErrorMessage(error))
        selectedToken &&
          AnalyticsService.capture('SendTransactionFailed', {
            errorMessage: error.message,
            chainId: selectedToken.networkChainId
          })
      }
    },
    [selectedToken]
  )

  return { onSuccess, onFailure }
}
