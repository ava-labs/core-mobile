import FCMService from 'services/fcm/FCMService'
import { NewsChannelId } from 'services/notifications/channels'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'

export async function unsubscribeNewsNotifications({
  channelIds
}: {
  channelIds: NewsChannelId[]
}): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await unSubscribeForNews({ deviceArn, channelIds })
}
