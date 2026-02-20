import { mapTransferToSwapStatus, SwapActivityItem } from './types'

/**
 * Returns true if a swap activity can be dismissed by the user (swiped away)
 * or cleared by the "Clear All" button.
 *
 * In-progress swaps are intentionally kept in the list until they resolve so
 * the user can track them; only terminal states (completed / failed) are
 * eligible for removal.
 */
export function isSwapDismissable(swap: SwapActivityItem): boolean {
  const status = mapTransferToSwapStatus(swap.transfer)
  return status === 'completed' || status === 'failed'
}
