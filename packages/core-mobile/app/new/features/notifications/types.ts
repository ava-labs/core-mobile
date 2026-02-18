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
