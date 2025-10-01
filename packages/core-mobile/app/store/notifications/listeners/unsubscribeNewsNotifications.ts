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
    channelIds.forEach(channelId => {
      AnalyticsService.capture('PushNotificationUnsubscribed', {
        channelType: 'news',
        channelId: channelId,
        reason: 'success'
      })
    })
  } catch (error) {
    channelIds.forEach(channelId => {
      AnalyticsService.capture('PushNotificationUnsubscribed', {
        channelType: 'news',
        channelId: channelId,
        reason: 'failure'
      })
    })
    throw error
  }
}
