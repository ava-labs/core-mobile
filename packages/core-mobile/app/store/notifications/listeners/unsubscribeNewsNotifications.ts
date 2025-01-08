import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'
import { ChannelId } from 'services/notifications/channels'

export async function unsubscribeNewsNotifications({
  channelIds
}: {
  channelIds?: ChannelId[]
}): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)
  await unSubscribeForNews({ deviceArn, channelIds })
}
