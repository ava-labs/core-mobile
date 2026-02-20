import { useMemo } from 'react'
import { useSwapActivitiesStore } from 'new/features/notifications/store'
import { mapTransferToSwapStatus } from 'new/features/notifications/utils'
import { SwapActivityItem } from 'new/features/notifications/types'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'

/**
 * Returns in-progress swap activities, optionally filtered by chain and token symbol.
 * A swap is included when:
 *   - its status is `in_progress`
 *   - its source OR target chain matches `chainId` (if provided)
 *   - its source OR target asset matches `symbol` (if provided)
 */
export function useInProgressSwaps({
  chainId,
  symbol
}: {
  chainId?: number
  symbol?: string
}): SwapActivityItem[] {
  const { swapActivities } = useSwapActivitiesStore()

  return useMemo(() => {
    return Object.values(swapActivities)
      .filter(s => mapTransferToSwapStatus(s.transfer) === 'in_progress')
      .filter(s => {
        if (!chainId) return true
        const sourceId = getChainIdFromCaip2(s.transfer.sourceChain.chainId)
        const targetId = getChainIdFromCaip2(s.transfer.targetChain.chainId)
        return sourceId === chainId || targetId === chainId
      })
      .filter(s => {
        if (!symbol) return true
        return (
          s.transfer.sourceAsset.symbol === symbol ||
          s.transfer.targetAsset.symbol === symbol
        )
      })
  }, [swapActivities, chainId, symbol])
}
