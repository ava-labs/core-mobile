import { Transfer } from 'features/swap/types'
import { AccountCollection } from 'store/account/types'
import { Wallet } from 'store/wallet/types'
import {
  AppNotification,
  NotificationCategory,
  NotificationTab,
  NotificationType,
  NotificationSwapStatus,
  isRecurringSwapNotification
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
 * Semantic bucket for a recurring-swap `data.status` string. This is the single
 * source of truth for the raw-status vocabulary, shared by the two places that
 * branch on it: `isTerminalRecurringSwapNotification` here (row actionability)
 * and `resolveBadge` in `RecurringSwapItem.tsx` (the colored status badge).
 * Both read the same backend strings and must agree on what each one means, so
 * route every new status through this classifier rather than re-listing literals
 * at the call site.
 *
 *   - 'failed'    → a fill failed (red badge; terminal / non-actionable)
 *   - 'cancelled' → schedule was stopped (terminal / non-actionable, but no badge)
 *   - 'completed' → the schedule's final leg landed (green "Completed"; terminal)
 *   - 'fill'      → a mid-schedule leg landed ('active' / 'executed'; green
 *                   "Executed"; NOT terminal on its own — a finite final leg is
 *                   detected separately via remainingOrders)
 *   - 'unknown'   → unrecognized status (no badge; not terminal on its own)
 */
export type RecurringSwapStatusKind =
  | 'failed'
  | 'cancelled'
  | 'completed'
  | 'fill'
  | 'unknown'

export function classifyRecurringSwapStatus(
  rawStatus: string
): RecurringSwapStatusKind {
  switch (rawStatus.toLowerCase()) {
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'cancelled'
    case 'completed':
      return 'completed'
    case 'active':
    case 'executed':
      return 'fill'
    default:
      return 'unknown'
  }
}

/**
 * A recurring-swap notification is "terminal" when its schedule will no longer
 * appear on the management screen — which lists only Active / Paused schedules
 * (`RecurringSchedulesScreen` filters out Cancelled / Completed). Such a
 * notification deep-links to a schedule the user can't see, so the row is
 * rendered non-actionable (no chevron, no navigation) by `hasActionableUrl`.
 *
 * Read off the structured `data` block (NOT the human-facing copy):
 *   - status classifies as a terminal event ('completed' | 'cancelled' |
 *     'failed'), or
 *   - it's the final leg of a finite schedule (`numberOfOrders !== -1` and no
 *     fills remain). Infinite / DCA schedules (`numberOfOrders === -1`) never
 *     reach this state.
 *
 * Note: 'failed' is a per-fill event, not a `RecurringOrderStatus` — a failed
 * fill can occur on a schedule that stays Active. We still treat it as
 * non-actionable per product intent (failures generally precede auto-cancel);
 * if a still-Active schedule's failure should remain tappable, remap 'failed'
 * in `classifyRecurringSwapStatus` (it also drives the red badge) or special-case
 * it here.
 */
export function isTerminalRecurringSwapNotification(
  notification: AppNotification
): boolean {
  if (!isRecurringSwapNotification(notification)) return false
  const data = notification.data
  if (!data) return false

  const kind = classifyRecurringSwapStatus(data.status)
  if (kind === 'completed' || kind === 'cancelled' || kind === 'failed') {
    return true
  }
  // Final leg of a finite schedule — no fills left to run.
  return (
    data.numberOfOrders !== undefined &&
    data.remainingOrders !== undefined &&
    data.numberOfOrders !== -1 &&
    data.remainingOrders === 0
  )
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
    case 'RECURRING_SWAP':
      // Recurring-swap fills / completions / failures are on-chain
      // transaction-like events the user cares about alongside balance
      // changes. Sharing the TRANSACTION bucket means they land on the
      // Transactions tab without needing a dedicated tab.
      return NotificationCategory.TRANSACTION
    case 'NEWS':
    default:
      return NotificationCategory.NEWS
  }
}

/**
 * Builds a lookup map from lowercase EVM address to a short
 * "wallet/account" label for every owned account, so balance-change
 * notifications in the Notification Center can be attributed to the
 * correct wallet without each list row re-subscribing to Redux.
 *
 * Single-wallet users see just the account name; multi-wallet users see
 * "{walletName} · {accountName}". When the same EVM address is owned by
 * accounts in multiple wallets (e.g. a private-key wallet importing a key
 * already derived inside a mnemonic wallet), the active account wins so
 * the user sees the wallet they currently consider canonical for that
 * address.
 */
export function buildAccountLabelMap(
  accounts: AccountCollection,
  wallets: { [id: string]: Wallet },
  activeAccountId?: string | null
): Map<string, string> {
  const multiWallet = Object.keys(wallets).length > 1
  const map = new Map<string, string>()

  // Process the active account first so its label wins on collisions; the
  // remaining accounts only fill in addresses that are not already covered.
  const activeAccount = activeAccountId ? accounts[activeAccountId] : undefined
  const ordered = activeAccount
    ? [
        activeAccount,
        ...Object.values(accounts).filter(a => a.id !== activeAccount.id)
      ]
    : Object.values(accounts)

  for (const account of ordered) {
    const key = account.addressC.toLowerCase()
    if (map.has(key)) continue
    const wallet = multiWallet ? wallets[account.walletId] : undefined
    const label = wallet ? `${wallet.name} · ${account.name}` : account.name
    map.set(key, label)
  }

  return map
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
