import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import {
  maybePromptEarnNotification,
  selectHasPromptedAfterFirstDelegation,
  selectNotificationSubscription,
  setHasPromptedAfterFirstDelegation
} from '../slice'

export const handleMaybePromptEarnNotification = async (
  action: ReturnType<typeof maybePromptEarnNotification>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  const state = listenerApi.getState()
  const isSubscribedToStakingComplete = selectNotificationSubscription(
    ChannelId.STAKING_COMPLETE
  )(state)

  const hasPromptedAfterFirstDelegation =
    selectHasPromptedAfterFirstDelegation(state)
  if (
    !hasPromptedAfterFirstDelegation &&
    (!isSubscribedToStakingComplete ||
      blockedNotifications.has(ChannelId.STAKING_COMPLETE))
  ) {
    // @ts-ignore
    Navigation.navigate({
      // @ts-ignore
      name: AppNavigation.Modal.EnableNotificationsPrompt,
      params: {
        // @ts-ignore
        notificationChannel: ChannelId.STAKING_COMPLETE,
        title: 'Turn on Notifications?',
        message:
          'You will be notified when staking is complete. You can change your preference in settings.'
      }
    })
    listenerApi.dispatch(setHasPromptedAfterFirstDelegation(true))
  }
}
