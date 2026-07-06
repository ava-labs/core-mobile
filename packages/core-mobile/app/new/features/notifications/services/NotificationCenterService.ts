import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'
import { BackendNotification, NotificationResponse } from '../types'
import { mapTypeToCategory } from '../utils'
import {
  NotificationListResponseSchema,
  SuccessResponseSchema,
  BalanceChangesMetadataSchema,
  PriceAlertsMetadataSchema,
  NewsPriceAlertMetadataSchema,
  NewsMetadataSchema,
  RecurringSwapMetadataSchema
} from './schemas'

const BASE_URL = Config.NOTIFICATION_SENDER_API_URL

// Base fields shared by every variant of `BackendNotification` — extracted so
// the per-type helpers below can spread it without recomputing.
type TransformBase = {
  id: string
  category: ReturnType<typeof mapTypeToCategory>
  title: string
  body: string
  timestamp: number
  deepLinkUrl: string | undefined
}

// Per-type parse helpers. Each safe-parses the metadata against its schema and
// either returns the typed `data` or `undefined` (logged) so the row still
// renders with the backend-formatted title / body / category. Extracted from
// `transformNotification` so the dispatcher itself stays linear and below the
// sonarjs cognitive-complexity cap (the four sequential case bodies + their
// safe-parse branches push the inline form over the limit).
function transformBalanceChanges(
  base: TransformBase,
  metadata: unknown
): BackendNotification {
  const parsed = BalanceChangesMetadataSchema.safeParse(metadata)
  if (!parsed.success) {
    Logger.error(
      '[NotificationCenterService] BALANCE_CHANGES metadata parse failed; falling back to generic row',
      parsed.error
    )
  }
  return {
    ...base,
    type: 'BALANCE_CHANGES',
    data: parsed.success ? parsed.data : undefined
  }
}

function transformPriceAlerts(
  base: TransformBase,
  metadata: unknown
): BackendNotification {
  const parsed = PriceAlertsMetadataSchema.safeParse(metadata)
  if (!parsed.success) {
    Logger.error(
      '[NotificationCenterService] PRICE_ALERTS metadata parse failed; falling back to generic row',
      parsed.error
    )
  }
  return {
    ...base,
    type: 'PRICE_ALERTS',
    data: parsed.success ? parsed.data : undefined
  }
}

// NEWS double-shape: the backend wraps price-alerts as `type:"NEWS" +
// event:"PRICE_ALERTS" + data[]`. Detect that first and re-emit as a
// PRICE_ALERTS row so the in-app list renders the same `PriceAlertItem`
// regardless of whether the backend sent the canonical or wrapped form.
function transformNews(
  base: TransformBase,
  metadata: unknown
): BackendNotification {
  const priceAlert = NewsPriceAlertMetadataSchema.safeParse(metadata)
  if (priceAlert.success) {
    const priceData = priceAlert.data.data[0]!
    return {
      ...base,
      category: mapTypeToCategory('PRICE_ALERTS'),
      type: 'PRICE_ALERTS' as const,
      data: {
        ...priceData,
        url: priceAlert.data.url
      }
    }
  }
  const parsed = NewsMetadataSchema.safeParse(metadata)
  if (!parsed.success) {
    Logger.error(
      '[NotificationCenterService] NEWS metadata parse failed; falling back to generic row',
      parsed.error
    )
  }
  return {
    ...base,
    type: 'NEWS',
    data: parsed.success ? parsed.data : undefined
  }
}

function transformRecurringSwap(
  base: TransformBase,
  metadata: unknown
): BackendNotification {
  // Backend (Sarp PRs #172 / #174) sends order progress fields in the
  // metadata block. Parse-failures fall back to a generic row — title /
  // body / category from `base` are still rendered, so the user still
  // sees the notification even if the schema drifts.
  const parsed = RecurringSwapMetadataSchema.safeParse(metadata)
  if (!parsed.success) {
    Logger.error(
      '[NotificationCenterService] RECURRING_SWAP metadata parse failed; falling back to generic row',
      parsed.error
    )
  }
  return {
    ...base,
    type: 'RECURRING_SWAP',
    data: parsed.success ? parsed.data : undefined
  }
}

/**
 * Transform API notification response to app notification format
 * API returns: notificationId, createdAt, metadata
 * App uses: id, timestamp, data
 */
function transformNotification(
  response: NotificationResponse
): BackendNotification {
  const base: TransformBase = {
    id: response.notificationId,
    category: mapTypeToCategory(response.type),
    title: response.title,
    body: response.body,
    timestamp: response.createdAt,
    deepLinkUrl: response.metadata?.url
  }

  switch (response.type) {
    case 'BALANCE_CHANGES':
      return transformBalanceChanges(base, response.metadata)
    case 'PRICE_ALERTS':
      return transformPriceAlerts(base, response.metadata)
    case 'NEWS':
      return transformNews(base, response.metadata)
    case 'RECURRING_SWAP':
      return transformRecurringSwap(base, response.metadata)
    default: {
      // Exhaustiveness guard: a new NotificationType must add its case above.
      // Unreachable today — `response.type` is validated against the zod enum
      // upstream (NotificationListResponseSchema in fetchNotifications), so an
      // unknown type never reaches here. Assigning to `never` makes a future
      // enum member a compile error; the throw (caught by fetchNotifications,
      // which returns []) is the runtime backstop, replacing the previous
      // implicit `undefined` return that would have leaked into the list.
      const unreachable: never = response.type
      throw new Error(
        `transformNotification: unhandled notification type ${String(
          unreachable
        )}`
      )
    }
  }
}

/**
 * Service for notification center API interactions
 * Follows the singleton service pattern used in the codebase
 */
class NotificationCenterService {
  /**
   * Fetch all notifications for a device
   */
  async fetchNotifications(deviceArn: string): Promise<BackendNotification[]> {
    try {
      const response = await appCheckPostJson(
        `${BASE_URL}/v1/push/notification-center/list`,
        JSON.stringify({ deviceArn })
      )

      if (!response.ok) {
        throw new Error(`${response.status}:${response.statusText}`)
      }

      const json = await response.json()
      const parsed = NotificationListResponseSchema.safeParse(json)

      if (!parsed.success) {
        Logger.error(
          '[NotificationCenterService] Response validation failed:',
          parsed.error
        )
        return []
      }

      return parsed.data.notifications.map(transformNotification)
    } catch (error) {
      Logger.error(
        '[NotificationCenterService] fetchNotifications failed:',
        error
      )
      return []
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(deviceArn: string, notificationId: string): Promise<void> {
    try {
      const response = await appCheckPostJson(
        `${BASE_URL}/v1/push/notification-center/mark-as-read`,
        JSON.stringify({ deviceArn, notificationId })
      )

      if (!response.ok) {
        throw new Error(`${response.status}:${response.statusText}`)
      }

      const json = await response.json()
      const parsed = SuccessResponseSchema.safeParse(json)
      if (!parsed.success) {
        throw new Error('Unexpected response from mark-as-read')
      }
    } catch (error) {
      Logger.error('[NotificationCenterService] markAsRead failed:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(deviceArn: string): Promise<void> {
    try {
      const response = await appCheckPostJson(
        `${BASE_URL}/v1/push/notification-center/mark-all-as-read`,
        JSON.stringify({ deviceArn })
      )

      if (!response.ok) {
        throw new Error(`${response.status}:${response.statusText}`)
      }

      const json = await response.json()
      const parsed = SuccessResponseSchema.safeParse(json)
      if (!parsed.success) {
        throw new Error('Unexpected response from mark-all-as-read')
      }
    } catch (error) {
      Logger.error('[NotificationCenterService] markAllAsRead failed:', error)
      throw error
    }
  }
}

export default new NotificationCenterService()
