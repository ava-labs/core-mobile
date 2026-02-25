import { Button } from '@avalabs/k2-alpine'
import React from 'react'
import { FusionTransfer } from 'features/swapV2/types'
import { useNavigateToSwap } from 'features/swapV2/hooks/useNavigateToSwap'
import { NotificationSwapStatus } from '../types'

export const RetrySwapButton = ({
  status,
  item
}: {
  status: NotificationSwapStatus
  item: FusionTransfer
}): JSX.Element | null => {
  const { navigateToSwap } = useNavigateToSwap()

  if (status !== 'failed') return null

  return (
    <Button
      type="secondary"
      size="small"
      onPress={() =>
        navigateToSwap({
          fromTokenId: item.fromToken.internalId,
          toTokenId: item.toToken.internalId,
          retryingSwapActivityId: item.transfer.id
        })
      }>
      Retry
    </Button>
  )
}
