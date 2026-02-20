import {
  AppNotification,
  NotificationCategory,
  NotificationTab,
  NotificationType,
  SwapActivityItem,
  SwapStatus,
  SwapTransfer
} from './types'

/**
 * Returns true if a swap activity can be dismissed by the user (swiped away)
 * or cleared by the "Clear All" button.
 *
 * In-progress swaps are intentionally kept in the list until they resolve so
 * the user can track them; only terminal states (completed / failed) are
 * eligible for removal.
 */
export function isSwapCompletedOrFailed(swap: SwapActivityItem): boolean {
  const status = mapTransferToSwapStatus(swap.transfer)
  return status === 'completed' || status === 'failed'
}

/**
 * Maps the raw backend transfer status to the simplified SwapStatus used in
 * the UI. Both "source-pending" and "target-pending" map to 'in_progress'.
 */
export function mapTransferToSwapStatus(transfer: SwapTransfer): SwapStatus {
  const lower = transfer.status.toLowerCase()

  if (lower === 'completed' || lower === 'target-confirmed') return 'completed'
  if (
    lower.includes('fail') ||
    lower === 'error' ||
    lower === 'source-failed' ||
    lower === 'target-failed'
  )
    return 'failed'

  // source-pending, source-confirmed, target-pending → all still in progress
  return 'in_progress'
}

/**
 * Returns the SwapStatus for the **source** (From) chain only.
 *   - source-pending                                          → in_progress
 *   - source-confirmed / target-pending / completed / etc.   → completed
 *   - source-failed / failed                                  → failed
 */
export function mapTransferToSourceChainStatus(
  transfer: SwapTransfer
): SwapStatus {
  const lower = transfer.status.toLowerCase()

  if (lower === 'source-failed' || lower === 'failed' || lower === 'error')
    return 'failed'

  if (lower === 'source-pending') return 'in_progress'

  // source-confirmed, target-pending, target-confirmed, completed → source done
  return 'completed'
}

/**
 * Returns the SwapStatus for the **target** (To) chain only.
 *   - source-pending / source-confirmed   → in_progress (target hasn't started)
 *   - target-pending                      → in_progress
 *   - target-confirmed / completed        → completed
 *   - target-failed / failed              → failed
 */
export function mapTransferToTargetChainStatus(
  transfer: SwapTransfer
): SwapStatus {
  const lower = transfer.status.toLowerCase()

  if (
    lower === 'target-failed' ||
    lower === 'failed' ||
    lower === 'error' ||
    lower === 'source-failed'
  )
    return 'failed'

  if (lower === 'completed' || lower === 'target-confirmed') return 'completed'

  // source-pending, source-confirmed, target-pending → target not done yet
  return 'in_progress'
}

/**
 * Map notification type to category for UI tabs
 */
export function mapTypeToCategory(
  type: NotificationType
): NotificationCategory {
  switch (type) {
    case 'BALANCE_CHANGES':
      return NotificationCategory.TRANSACTION
    case 'PRICE_ALERTS':
      return NotificationCategory.PRICE_UPDATE
    case 'NEWS':
    default:
      return NotificationCategory.NEWS
  }
}

/**
 * Filter notifications by tab
 */
export function filterByTab(
  notifications: AppNotification[],
  tab: NotificationTab
): AppNotification[] {
  switch (tab) {
    case NotificationTab.ALL:
      return notifications
    case NotificationTab.TRANSACTIONS:
      return notifications.filter(
        n => n.category === NotificationCategory.TRANSACTION
      )
    case NotificationTab.PRICE_UPDATES:
      return notifications.filter(
        n => n.category === NotificationCategory.PRICE_UPDATE
      )
    default:
      return notifications
  }
}
