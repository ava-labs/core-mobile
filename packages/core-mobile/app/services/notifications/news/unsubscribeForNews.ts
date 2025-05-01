import Logger from 'utils/Logger'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'
import { NewsChannelId } from '../channels'
import { channelIdToNewsEventMap } from './events'

export async function unSubscribeForNews({
  deviceArn,
  channelIds
}: {
  deviceArn: string
  channelIds: NewsChannelId[]
}): Promise<{ message: 'ok' }> {
  const events = channelIds
    .map(channelId => {
      return channelIdToNewsEventMap[channelId]
    })
    .filter(item => item !== undefined)

  const response = await fetchWithAppCheck({
    url: Config.NOTIFICATION_SENDER_API_URL + '/v1/push/news/unsubscribe',
    bodyJson: JSON.stringify({
      deviceArn,
      events
    })
  }).catch(error => {
    Logger.error(`[unsubscribeForNews.ts][unsubscribe]${error}`)
    throw error
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
