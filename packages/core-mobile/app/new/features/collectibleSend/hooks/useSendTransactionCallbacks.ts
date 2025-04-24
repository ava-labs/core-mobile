import { showSnackbar } from 'common/utils/toast'
import { useSendSelectedToken } from 'features/send/store'
import { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'

export const useSendTransactionCallbacks = (): {
  onSuccess: ({
    txHash,
    onDismiss
  }: {
    txHash: string
    onDismiss: () => void
  }) => void
  onFailure: (error: unknown) => void
} => {
  const [selectedToken, setSelectedToken] = useSendSelectedToken()

  const onSuccess = useCallback(
    ({
      txHash,
      onDismiss
    }: {
      txHash: string
      onDismiss: () => void
    }): void => {
      selectedToken &&
        AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
          chainId: selectedToken.networkChainId,
          txHash
        })
      audioFeedback(Audios.Send)
      setSelectedToken(undefined)

      onDismiss()
    },
    [selectedToken, setSelectedToken]
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
