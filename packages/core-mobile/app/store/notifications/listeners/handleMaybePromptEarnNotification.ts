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
) => {
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
    Navigation.navigate(AppNavigation.Earn.EarnNotificationsPrompt)
    listenerApi.dispatch(setHasPromptedAfterFirstDelegation(true))
  }
}
