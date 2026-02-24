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
