import Logger from 'utils/Logger'
import Config from 'react-native-config'
import messaging from '@react-native-firebase/messaging'
import fetchWithAppCheck from 'utils/httpClient'
import { ChannelId } from '../channels'
import { newsEvents } from './events'

export async function unSubscribeForNews({
  deviceArn,
  channelIds
}: {
  deviceArn: string
  channelIds?: ChannelId[]
}): Promise<{ message: 'ok' }> {
  const events =
    channelIds === undefined
      ? []
      : channelIds
          .map(channelId => {
            if (
              channelId === ChannelId.BALANCE_CHANGES ||
              channelId === ChannelId.STAKING_COMPLETE
            ) {
              return
            }
            return newsEvents[channelId]
          })
          .filter(item => item !== undefined)

  const response = await fetchWithAppCheck(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/news/unsubscribe',
    JSON.stringify({
      deviceArn,
      events
    })
  ).catch(error => {
    //as fallback invalidate token so user doesn't get notifications
    messaging().deleteToken()
    Logger.error(`[unsubscribeForNews.ts][unsubscribe]${error}`)
    throw error
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
