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
  NewsMetadataSchema,
  RecurringSwapMetadataSchema
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
export type RecurringSwapMetadata = z.infer<typeof RecurringSwapMetadataSchema>

export { BalanceChangeEventSchema }

/**
 * Union of all notification metadata types
 */
export type NotificationMetadata =
  | BalanceChangesMetadata
  | PriceAlertsMetadata
  | NewsMetadata
  | RecurringSwapMetadata

/**
 * Notification categories mapping to UI tabs.
 *
 * There is intentionally no `RECURRING_SWAP` category. Recurring-swap fills /
 * completions / failures are on-chain transaction-like events, so
 * `mapTypeToCategory` folds the `RECURRING_SWAP` notification *type* into the
 * `TRANSACTION` bucket — they surface on the Transactions tab alongside
 * balance changes (matching the Figma list) without needing a dedicated tab.
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
  | (BaseNotification & {
      type: 'RECURRING_SWAP'
      data?: RecurringSwapMetadata
    })

/**
 * Union type for all notifications (used in UI)
 */
export type AppNotification = BackendNotification

/**
 * Type guard for price alert notifications.
 *
 * Also matches NEWS-wrapped price alerts (`category === 'NEWS'` +
 * `data.event === 'PRICE_ALERTS'`). The `'event' in data` runtime check is
 * load-bearing now that the `data` union includes RecurringSwapMetadata
 * (which has no `event` field) — a direct `.event` access would fail at
 * compile time. Semantics are unchanged: the in-check is true exactly
 * when `data` carries the News/Balance/PriceAlerts shape.
 */
export function isPriceAlertNotification(
  notification: AppNotification
): notification is BaseNotification & {
  type: 'PRICE_ALERTS'
  data?: PriceAlertsMetadata
} {
  if (notification.type === 'PRICE_ALERTS') return true
  if (notification.category !== 'NEWS') return false
  const data = notification.data
  return data !== undefined && 'event' in data && data.event === 'PRICE_ALERTS'
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

/**
 * Type guard for recurring-swap notifications. Used by the notifications-list
 * renderer + the `RecurringSwapItem` row component to derive title / subtitle
 * / status badge from the metadata.
 */
export function isRecurringSwapNotification(
  notification: AppNotification
): notification is BaseNotification & {
  type: 'RECURRING_SWAP'
  data?: RecurringSwapMetadata
} {
  return notification.type === 'RECURRING_SWAP'
}

// ─────────────────────────────────────────────────────────────────────────────
// Swap activity types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Status of a swap transaction.
 */
export enum NotificationSwapStatus {
  Completed = 'completed',
  InProgress = 'in_progress',
  Failed = 'failed',
  Incomplete = 'incomplete',
  Refunded = 'refunded'
}
