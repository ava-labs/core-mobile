import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'
import {
  BackendNotification,
  NotificationResponse,
  mapTypeToCategory
} from '../types'
import {
  NotificationListResponseSchema,
  SuccessResponseSchema,
  BalanceChangesMetadataSchema,
  PriceAlertsMetadataSchema,
  NewsMetadataSchema
} from './schemas'

const BASE_URL = Config.NOTIFICATION_SENDER_API_URL

/**
 * Transform API notification response to app notification format
 * API returns: notificationId, createdAt, metadata
 * App uses: id, timestamp, data
 */
function transformNotification(
  response: NotificationResponse
): BackendNotification {
  const base = {
    id: response.notificationId,
    category: mapTypeToCategory(response.type),
    title: response.title,
    body: response.body,
    timestamp: response.createdAt,
    deepLinkUrl: response.metadata?.url
  }

  switch (response.type) {
    case 'BALANCE_CHANGES': {
      const parsed = BalanceChangesMetadataSchema.safeParse(response.metadata)
      return {
        ...base,
        type: 'BALANCE_CHANGES',
        data: parsed.success ? parsed.data : undefined
      }
    }
    case 'PRICE_ALERTS': {
      const parsed = PriceAlertsMetadataSchema.safeParse(response.metadata)
      return {
        ...base,
        type: 'PRICE_ALERTS',
        data: parsed.success ? parsed.data : undefined
      }
    }
    case 'NEWS': {
      const parsed = NewsMetadataSchema.safeParse(response.metadata)
      return {
        ...base,
        type: 'NEWS',
        data: parsed.success ? parsed.data : undefined
      }
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
      throw error
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
