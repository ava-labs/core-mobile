import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { AnyAction } from '@reduxjs/toolkit'
import { onLogOut } from 'store/app'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { turnOffNotificationsFor } from 'store/notifications/slice'
import { ChannelId } from 'services/notifications/channels'

export async function unsubscribeBalanceChangeNotifications(
  action: AnyAction
): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const { deviceArn } = await registerDeviceToNotificationSender(fcmToken) //TODO: for optimisation, store deviceArn

  //if logged out or disabled notifications, unsubscribe
  if (
    action.type === onLogOut.type ||
    (action.type === turnOffNotificationsFor.type &&
      action.payload.channelId === ChannelId.BALANCE_CHANGES)
  ) {
    await unSubscribeForBalanceChange({ deviceArn })
  }
}
