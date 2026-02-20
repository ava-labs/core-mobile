import { Button } from '@avalabs/k2-alpine'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import React from 'react'
import { SwapActivityItem, SwapStatus } from '../types'

export const RetryButton = ({
  status,
  item
}: {
  status: SwapStatus
  item: SwapActivityItem
}): JSX.Element | null => {
  const { navigateToSwap } = useNavigateToSwap()

  if (status !== 'failed') return null

  return (
    <Button
      type="secondary"
      size="small"
      onPress={() =>
        navigateToSwap({
          fromTokenId: item.fromTokenId,
          toTokenId: item.toTokenId,
          retryingSwapActivityId: item.transfer.id
        })
      }>
      Retry
    </Button>
  )
}
