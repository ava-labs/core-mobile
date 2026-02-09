import { registerAndGetDeviceArn } from 'services/notifications/registerDeviceToNotificationSender'
import { unSubscribeForNews } from 'services/notifications/news/unsubscribeForNews'
import { NewsChannelId } from 'services/notifications/channels'

export async function unsubscribeNewsNotifications({
  channelIds
}: {
  channelIds: NewsChannelId[]
}): Promise<void> {
  const deviceArn = await registerAndGetDeviceArn()
  await unSubscribeForNews({ deviceArn, channelIds })
}
