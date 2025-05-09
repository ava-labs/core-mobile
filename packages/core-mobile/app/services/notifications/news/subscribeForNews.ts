import Logger from 'utils/Logger'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'
import { NewsChannelId } from '../channels'
import { channelIdToNewsEventMap } from './events'

export async function subscribeForNews({
  deviceArn,
  channelIds
}: {
  deviceArn: string
  channelIds: NewsChannelId[]
}): Promise<{ message: 'ok' }> {
  if (channelIds.length === 0) {
    Logger.error(
      '[subscribeForNews.ts][subscribeForNews]No channelIds provided'
    )
    throw new Error('No channelIds provided to subscribe for news')
  }

  const events = channelIds
    .map(channelId => {
      return channelIdToNewsEventMap[channelId]
    })
    .filter(item => item !== undefined)
  const response = await fetchWithAppCheck({
    url: Config.NOTIFICATION_SENDER_API_URL + '/v1/push/news/subscribe',
    bodyJson: JSON.stringify({
      deviceArn,
      events
    })
  }).catch(error => {
    Logger.error(`[subscribeForNews.ts][subscribe]${error}`)
    throw new Error(error)
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
