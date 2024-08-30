import { AppListenerEffectAPI } from 'store/index'
import { selectAccounts } from 'store/account'
import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import { ChainId } from '@avalabs/core-chains-sdk'
import FCMService from 'services/fcm/FCMService'
import { AnyAction } from '@reduxjs/toolkit'
import { onLogOut } from 'store/app'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { subscribeForBalanceChange } from 'services/notifications/balanceChange/subscribeForBalanceChange'
import Logger from 'utils/Logger'
import { turnOffNotificationsFor } from 'store/notifications/slice'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'

export async function setupBalanceChangeNotifications(
  listenerApi: AppListenerEffectAPI,
  action: AnyAction
): Promise<void> {
  const { getState } = listenerApi
  const fcmToken = await FCMService.getFCMToken()
  const { deviceArn } = await registerDeviceToNotificationSender(fcmToken) //TODO: for optimisation, store deviceArn

  //if logged out or disabled notifications, unsubscribe
  if (
    action.type === onLogOut.type ||
    (action.type === turnOffNotificationsFor.type &&
      action.payload.channelId === ChannelId.BALANCE_CHANGES)
  ) {
    await unSubscribeForBalanceChange({ deviceArn })
    return
  }

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
  const accounts = selectAccounts(getState())
  const addresses = Object.values(accounts).map(account => account.addressC)
  const response = await subscribeForBalanceChange({
    addresses,
    chainIds,
    deviceArn
  })
  if (response.message !== 'ok') {
    Logger.error(
      `[packages/core-mobile/app/store/notifications/listeners/setupBalanceChangeNotifications.ts][setupBalanceChangeNotifications]${response.message}`
    )
    throw Error(response.message)
  }
}
