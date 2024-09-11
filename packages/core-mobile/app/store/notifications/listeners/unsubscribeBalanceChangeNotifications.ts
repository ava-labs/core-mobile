import { registerDeviceToNotificationSender } from 'services/notifications/balanceChange/registerDeviceToNotificationSender'
import FCMService from 'services/fcm/FCMService'
import { AnyAction, PayloadAction } from '@reduxjs/toolkit'
import { onLogOut } from 'store/app'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'
import { turnOffNotificationsFor } from 'store/notifications/slice'
import { ChannelId } from 'services/notifications/channels'
import { setFeatureFlags } from 'store/posthog'
import { FeatureFlags, FeatureGates } from 'services/posthog/types'

export async function unsubscribeBalanceChangeNotifications(
  action: AnyAction
): Promise<void> {
  const fcmToken = await FCMService.getFCMToken()
  const { deviceArn } = await registerDeviceToNotificationSender(fcmToken) //TODO: for optimisation, store deviceArn

  if (action.type === setFeatureFlags.type) {
    const setFeatureFlagsAction = action as PayloadAction<FeatureFlags>
    if (
      !setFeatureFlagsAction.payload[FeatureGates.BALANCE_CHANGE_NOTIFICATIONS]
    ) {
      await unSubscribeForBalanceChange({ deviceArn })
      return
    }
  }

  //if logged out or disabled notifications, unsubscribe
  if (
    action.type === onLogOut.type ||
    (action.type === turnOffNotificationsFor.type &&
      action.payload.channelId === ChannelId.BALANCE_CHANGES)
  ) {
    await unSubscribeForBalanceChange({ deviceArn })
  }
}
