import { TokenSubscriptionPayload } from 'services/notifications/priceAlert/types'
import Logger from 'utils/Logger'
import fetchWithAppCheck from 'utils/httpClient'
import Config from 'react-native-config'
import AnalyticsService from 'services/analytics/AnalyticsService'

export async function setPriceAlertSubscriptions(
  payload: TokenSubscriptionPayload
): Promise<void> {
  Logger.info(
    '[setPriceAlertSubscriptions] Setting token subscriptions:',
    payload.tokens.map(t => t.internalId)
  )

  try {
    const response = await fetchWithAppCheck(
      Config.NOTIFICATION_SENDER_API_URL +
        '/v1/push/price-alerts/custom/subscribe',
      JSON.stringify(payload)
    )

    if (response.ok) {
      const result = await response.json()
      Logger.info(
        '[setPriceAlertSubscriptions] Successfully subscribed to token price alerts:',
        result
      )

      AnalyticsService.capture('PushNotificationSubscribed', {
        channelType: 'price_alert',
        reason: 'success'
      })
    } else {
      throw new Error(`${response.status}:${response.statusText}`)
    }
  } catch (error) {
    AnalyticsService.capture('PushNotificationSubscribed', {
      channelType: 'price_alert',
      reason: 'failure'
    })

    Logger.error(
      `[setPriceAlertSubscriptions] Failed to set token subscriptions:`,
      error
    )
    throw error
  }
}
