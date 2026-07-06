import { transactionSnackbar } from 'common/utils/toast'
import { useSendSelectedToken } from 'features/send/store'
import { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
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
        AnalyticsService.capture('SendTransactionSucceeded', {
          encrypted: {
            chainId: selectedToken.networkChainId,
            txHash
          },
          caip2ChainId: getCaip2ChainId(selectedToken.networkChainId)
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
        transactionSnackbar.error({ error: getJsonRpcErrorMessage(error) })
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
