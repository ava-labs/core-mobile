import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts } from 'store/account'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import { ChainId } from '@avalabs/core-chains-sdk'
import FCMService from 'services/fcm/FCMService'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { subscribeForBalanceChange } from 'services/notifications/balanceChange/subscribeForBalanceChange'
import Logger from 'utils/Logger'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { selectNotificationSubscription } from '../slice'

export async function subscribeBalanceChangeNotifications(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { getState } = listenerApi

  const state = getState()

  const userHasEnabledBalanceNotification = selectNotificationSubscription(
    ChannelId.BALANCE_CHANGES
  )(state)

  if (!userHasEnabledBalanceNotification) {
    // skip if user has not enabled balance change notifications
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

  //check if only BALANCE_CHANGES notifications are denied
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  if (blockedNotifications.has(ChannelId.BALANCE_CHANGES)) {
    await unSubscribeForBalanceChange({ deviceArn })
    return
  }

  //subscribe
  const chainIds = [
    ChainId.AVALANCHE_MAINNET_ID.toString(),
    ChainId.AVALANCHE_TESTNET_ID.toString()
  ]
  const response = await subscribeForBalanceChange({
    addresses,
    chainIds,
    deviceArn
  })
  if (response.message !== 'ok') {
    Logger.error(
      `[setupBalanceChangeNotifications.ts][setupBalanceChangeNotifications]${response.message}`
    )
    throw Error(response.message)
  }
}
