import Logger from 'utils/Logger'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'
import { ChannelId } from '../channels'

export async function subscribeForNews({
  deviceArn,
  channelIds
}: {
  deviceArn: string
  channelIds: ChannelId[]
}): Promise<{ message: 'ok' }> {
  const response = await fetchWithAppCheck(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/news/subscribe',
    JSON.stringify({
      deviceArn,
      channelIds
    })
  ).catch(error => {
    Logger.error(`[subscribeForNews.ts][subscribe]${error}`)
    throw new Error(error)
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
