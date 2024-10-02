import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import { selectIsBalanceChangeNotificationsBlocked } from 'store/posthog'
import {
  selectHasPromptedForBalanceChange,
  selectNotificationSubscription,
  setHasPromptedForBalanceChange
} from '../slice'

let isWaitingForIntroMux = false

export const handleMaybePromptBalanceNotification = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isBalanceChangeNotificationsBlocked =
    selectIsBalanceChangeNotificationsBlocked(state)
  if (isBalanceChangeNotificationsBlocked) return
  if (isWaitingForIntroMux) return //if already waiting ignore this handler
  await waitIfIntroScreenIsYetNotDismissed(listenerApi)
  isWaitingForIntroMux = false

  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
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

async function waitIfIntroScreenIsYetNotDismissed(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { take } = listenerApi
  const state = listenerApi.getState()
  let hasSeenIntro = selectHasBeenViewedOnce(ViewOnceKey.CORE_INTRO)(state)
  while (!hasSeenIntro) {
    isWaitingForIntroMux = true
    const [{ payload }] = await take(setViewOnce.match)
    hasSeenIntro = payload === ViewOnceKey.CORE_INTRO
  }
}
