import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts } from 'store/account'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import Logger from 'utils/Logger'
import NotificationsService from 'services/notifications/NotificationsService'
import { NewsChannelId } from 'services/notifications/channels'
import { subscribeForNews } from 'services/notifications/news/subscribeForNews'
import { selectEnabledNewsNotificationSubscriptions } from '../slice'
import { unsubscribeNewsNotifications } from './unsubscribeNewsNotifications'

export async function subscribeNewsNotifications(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { getState } = listenerApi

  const state = getState()

  const enabledNewsNotifications =
    selectEnabledNewsNotificationSubscriptions(state)

  if (enabledNewsNotifications.length === 0) {
    // skip if user has not enabled any news notifications
    return
  }

  const accounts = selectAccounts(state)
  const addresses = Object.values(accounts).map(account => account.addressC)

  if (addresses.length === 0) {
    // skip if no addresses, means wallet is not yet created
    return
  }

  const fcmToken = await FCMService.getFCMToken()
  const deviceArn = await registerDeviceToNotificationSender(fcmToken)

  //check if only news notifications are denied
  const blockedNewsNotifications =
    await NotificationsService.getBlockedNewsNotifications()

  const newsChannelIds = Object.entries(blockedNewsNotifications).reduce(
    (acc, [channelId, enabled]) => {
      if (!enabled) {
        acc.push(channelId as NewsChannelId)
      }
      return acc
    },
    [] as NewsChannelId[]
  )
  if (newsChannelIds.length > 0) {
    await unsubscribeNewsNotifications({ channelIds: newsChannelIds })
  }

  //subscribe
  const response = await subscribeForNews({
    deviceArn,
    channelIds: enabledNewsNotifications
  })
  if (response.message !== 'ok') {
    Logger.error(
      `[subscribeNewsNotifications.ts][subscribeNewsNotifications]${response.message}`
    )
    throw Error(response.message)
  }
}
