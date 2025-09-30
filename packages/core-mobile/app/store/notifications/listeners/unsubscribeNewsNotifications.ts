import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'
import { NewsChannelId } from 'services/notifications/channels'
import AnalyticsService from 'services/analytics/AnalyticsService'

export async function unsubscribeNewsNotifications({
  channelIds
}: {
  channelIds: NewsChannelId[]
}): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  try {
    await unSubscribeForNews({ deviceArn, channelIds })
    // Track successful unsubscribe for each channel
    channelIds.forEach(() => {
      AnalyticsService.capture('PushNotificationUnsubscribed', {
        channelType: 'news',
        reason: 'success'
      })
    })
  } catch (error) {
    // Track failed unsubscribe
    channelIds.forEach(() => {
      AnalyticsService.capture('PushNotificationUnsubscribed', {
        channelType: 'news',
        reason: 'failure'
      })
    })
    throw error
  }
}
