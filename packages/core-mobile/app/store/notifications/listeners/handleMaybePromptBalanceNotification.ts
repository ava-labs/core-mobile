import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { AnyAction } from '@reduxjs/toolkit'
import {
  selectHasPromptedForBalanceChange,
  selectNotificationSubscription,
  setHasPromptedForBalanceChange
} from '../slice'

export const handleMaybePromptBalanceNotification = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  const state = listenerApi.getState()
  const isSubscribedToBalanceChanges = selectNotificationSubscription(
    ChannelId.BALANCE_CHANGES
  )(state)

  const hasPromptedForBalanceChange = selectHasPromptedForBalanceChange(state)
  if (
    !hasPromptedForBalanceChange &&
    (!isSubscribedToBalanceChanges ||
      blockedNotifications.has(ChannelId.BALANCE_CHANGES))
  ) {
    // @ts-ignore
    Navigation.navigate({
      // @ts-ignore
      name: AppNavigation.Modal.EnableNotificationsPrompt,
      params: {
        // @ts-ignore
        notificationChannel: ChannelId.BALANCE_CHANGES,
        title: 'Turn on Notifications?',
        message:
          'You will be notified when certain wallet actions occur. You can change your preference in settings.'
      }
    })
    listenerApi.dispatch(setHasPromptedForBalanceChange(true))
  }
}
