import { Transfer } from 'features/swap/types'
import { AccountCollection } from 'store/account/types'
import { Wallet } from 'store/wallet/types'
import {
  AppNotification,
  isBalanceChangeNotification,
  NotificationCategory,
  NotificationTab,
  NotificationType,
  NotificationSwapStatus
} from './types'

/**
 * Returns true if a swap activity can be dismissed by the user (swiped away)
 * or cleared by the "Clear All" button.
 *
 * In-progress swaps are intentionally kept in the list until they resolve so
 * the user can track them; only terminal states (completed / failed / refunded)
 * are eligible for removal.
 */
export function isSwapTerminal(transfer: Transfer): boolean {
  const status = mapTransferToSwapStatus(transfer)
  return (
    status === NotificationSwapStatus.Completed ||
    status === NotificationSwapStatus.Failed ||
    status === NotificationSwapStatus.Refunded
  )
}

/**
 * Maps the raw backend transfer status to the simplified SwapStatus used in
 * the UI. Both "source-pending" and "target-pending" map to 'in_progress'.
 * 'refunded' is a terminal state indicating a partial failure.
 */
export function mapTransferToSwapStatus(
  transfer: Transfer
): NotificationSwapStatus {
  const lower = transfer.status.toLowerCase()

  if (lower === 'completed') return NotificationSwapStatus.Completed
  if (lower === 'failed') return NotificationSwapStatus.Failed
  if (lower === 'refunded') return NotificationSwapStatus.Refunded

  // source-pending, source-completed, target-pending → all still in progress
  return NotificationSwapStatus.InProgress
}

/**
 * Returns the SwapStatus for the **source** (From) chain only.
 *   - source-pending                                           → in_progress
 *   - source-completed / target-pending / completed / etc.    → completed
 *   - refunded (source tx succeeded before refund was issued)  → completed
 *   - failed                                                   → failed
 */
export function mapTransferToSourceChainStatus(
  transfer: Transfer
): NotificationSwapStatus {
  const lower = transfer.status.toLowerCase()

  if (lower === 'failed') return NotificationSwapStatus.Failed
  if (lower === 'source-pending') return NotificationSwapStatus.InProgress

  // source-completed, target-pending, completed → source done
  return NotificationSwapStatus.Completed
}

/**
 * Returns the SwapStatus for the **target** (To) chain only.
 *   - source-pending / source-completed   → in_progress (target hasn't started)
 *   - target-pending                      → in_progress
 *   - completed                           → completed
 *   - refunded (target did not complete)  → incomplete
 *   - failed                              → failed
 */
export function mapTransferToTargetChainStatus(
  transfer: Transfer
): NotificationSwapStatus {
  const lower = transfer.status.toLowerCase()

  if (lower === 'failed') return NotificationSwapStatus.Failed
  if (lower === 'completed') return NotificationSwapStatus.Completed
  if (lower === 'refunded') return NotificationSwapStatus.Incomplete

  // source-pending, source-completed, target-pending → target not done yet
  return NotificationSwapStatus.InProgress
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
 * Drop balance-change notifications whose target address is no longer owned by
 * the user (wallet/account was removed). Non-balance-change notifications pass
 * through unchanged. The backend still returns these until its own cleanup
 * runs, so we filter client-side to avoid surfacing stranger-wallet activity in
 * the Notification Center — see CP-14129.
 */
export function filterByOwnedAddresses(
  notifications: AppNotification[],
  ownedAddresses: Set<string>
): AppNotification[] {
  return notifications.filter(n => {
    if (n.type !== 'BALANCE_CHANGES') return true
    const addr = n.data?.accountAddress?.toLowerCase()
    if (!addr) return true
    return ownedAddresses.has(addr)
  })
}

/**
 * Returns a short label identifying which wallet/account a balance-change
 * notification is for, so users with multiple imported wallets can tell them
 * apart. Returns null for non-balance-change notifications or when the
 * address is not owned by the user (e.g. backend lag after deletion).
 *
 * Single-wallet users see just the account name; multi-wallet users see
 * "{walletName} · {accountName}".
 */
export function getAccountLabel(
  notification: AppNotification,
  accounts: AccountCollection,
  wallets: { [id: string]: Wallet }
): string | null {
  if (!isBalanceChangeNotification(notification)) return null
  const addr = notification.data?.accountAddress?.toLowerCase()
  if (!addr) return null

  const account = Object.values(accounts).find(
    a => a.addressC.toLowerCase() === addr
  )
  if (!account) return null

  const walletCount = Object.keys(wallets).length
  if (walletCount > 1) {
    const wallet = wallets[account.walletId]
    if (wallet) return `${wallet.name} · ${account.name}`
  }
  return account.name
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
        n =>
          n.category === NotificationCategory.PRICE_UPDATE ||
          (n.type === 'NEWS' && n.data?.event === 'PRICE_ALERTS')
      )
    default:
      return notifications
  }
}
