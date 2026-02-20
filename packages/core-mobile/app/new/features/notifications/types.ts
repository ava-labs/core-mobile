import { z } from 'zod'
import {
  NotificationResponseSchema,
  NotificationTypeSchema,
  NotificationDataSchema,
  BalanceChangeEventSchema,
  NewsEventSchema,
  BalanceChangesTransferSchema,
  BalanceChangesMetadataSchema,
  PriceAlertsMetadataSchema,
  NewsMetadataSchema
} from './services/schemas'

/**
 * Inferred types from Zod schemas
 */
export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type NotificationData = z.infer<typeof NotificationDataSchema>
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>
export type BalanceChangeEvent = z.infer<typeof BalanceChangeEventSchema>
export type NewsEvent = z.infer<typeof NewsEventSchema>
export type BalanceChangesTransfer = z.infer<
  typeof BalanceChangesTransferSchema
>
export type BalanceChangesMetadata = z.infer<
  typeof BalanceChangesMetadataSchema
>
export type PriceAlertsMetadata = z.infer<typeof PriceAlertsMetadataSchema>
export type NewsMetadata = z.infer<typeof NewsMetadataSchema>

export { BalanceChangeEventSchema }

/**
 * Union of all notification metadata types
 */
export type NotificationMetadata =
  | BalanceChangesMetadata
  | PriceAlertsMetadata
  | NewsMetadata

/**
 * Notification categories mapping to UI tabs
 */
export enum NotificationCategory {
  TRANSACTION = 'TRANSACTION',
  PRICE_UPDATE = 'PRICE_UPDATE',
  NEWS = 'NEWS'
}

/**
 * Tab options for filtering notifications
 */
export enum NotificationTab {
  ALL = 'ALL',
  TRANSACTIONS = 'TRANSACTIONS',
  PRICE_UPDATES = 'PRICE_UPDATES'
}

/**
 * Base notification interface
 */
export interface BaseNotification {
  id: string
  category: NotificationCategory
  title: string
  body: string
  timestamp: number
  deepLinkUrl?: string
}

/**
 * Backend notification with typed metadata based on notification type
 */
export type BackendNotification =
  | (BaseNotification & {
      type: 'BALANCE_CHANGES'
      data?: BalanceChangesMetadata
    })
  | (BaseNotification & {
      type: 'PRICE_ALERTS'
      data?: PriceAlertsMetadata
    })
  | (BaseNotification & {
      type: 'NEWS'
      data?: NewsMetadata
    })

/**
 * Union type for all notifications (used in UI)
 */
export type AppNotification = BackendNotification

/**
 * Type guard for price alert notifications
 */
export function isPriceAlertNotification(
  notification: AppNotification
): notification is BaseNotification & {
  type: 'PRICE_ALERTS'
  data?: PriceAlertsMetadata
} {
  return notification.type === 'PRICE_ALERTS'
}

/**
 * Type guard for balance change notifications
 */
export function isBalanceChangeNotification(
  notification: AppNotification
): notification is BaseNotification & {
  type: 'BALANCE_CHANGES'
  data?: BalanceChangesMetadata
} {
  return notification.type === 'BALANCE_CHANGES'
}

// ─────────────────────────────────────────────────────────────────────────────
// Swap activity types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Status of a swap transaction.
 */
export type SwapStatus = 'completed' | 'in_progress' | 'failed'

/**
 * Asset info within a swap transfer (source or target).
 */
export interface SwapTransferAsset {
  type: string
  symbol: string
  name: string
  decimals: number
  address?: string
}

/**
 * Chain info within a swap transfer.
 * chainId is in CAIP-2 format, e.g. "eip155:43114"
 */
export interface SwapTransferChain {
  chainId: string
  chainName: string
}

/**
 * Source confirmation tracking within a swap transfer.
 */
export interface SwapTransferSource {
  confirmationCount: number
  requiredConfirmationCount: number
  startedAtMs: number
  txHash: string
}

/**
 * All backend status strings that Markr can return for a transfer.
 * The overall lifecycle is:
 *   source-pending → source-confirmed → target-pending → target-confirmed → completed
 * Any step can result in a corresponding *-failed or a top-level "failed".
 */
export type SwapTransferStatus =
  | 'source-pending'
  | 'source-confirmed'
  | 'target-pending'
  | 'target-confirmed'
  | 'completed'
  | 'source-failed'
  | 'target-failed'
  | 'failed'
  | 'error'

/**
 * Raw transfer object received from the Markr backend.
 */
export interface SwapTransfer {
  id: string
  amountIn: string
  amountOut: string
  /** Backend status string reflecting the overall swap lifecycle. */
  status: SwapTransferStatus | string
  sourceAsset: SwapTransferAsset
  targetAsset: SwapTransferAsset
  sourceChain: SwapTransferChain
  targetChain: SwapTransferChain
  /** Present once the source tx is broadcast. */
  source?: SwapTransferSource
  /** Present once the target tx is broadcast. */
  target?: SwapTransferSource
  fromAddress?: string
  toAddress?: string
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
 * Represents a swap activity item stored in the notification-center Zustand
 * store. All display-level data is derived at render time from this raw shape.
 */
export interface SwapActivityItem {
  /** Raw transfer payload received from the Markr backend */
  transfer: SwapTransfer
  /** localId of the "from" token (e.g. "NATIVE-AVAX" or a contract address) */
  fromTokenId: string
  /** localId of the "to" token */
  toTokenId: string
  /** Unix timestamp in milliseconds (set when the swap was initiated) */
  timestamp: number
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
