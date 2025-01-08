import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForNews } from 'services/notifications/balanceChange/unsubscribeForNews'
import { ChannelId } from 'services/notifications/channels'

export async function unsubscribeNewsNotifications({
  channelIds
}: {
  channelIds?: ChannelId[]
}): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken) //TODO: for optimisation, store deviceArn
  await unSubscribeForNews({ deviceArn, channelIds })
}
