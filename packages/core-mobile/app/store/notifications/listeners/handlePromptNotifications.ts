import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'

let isWaitingForIntroMux = false

export const handlePromptNotifications = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  if (isWaitingForIntroMux) return //if already waiting ignore this handler
  await waitIfIntroScreenIsYetNotDismissed(listenerApi)
  isWaitingForIntroMux = false

  const hasPromptedForNotifications = selectHasBeenViewedOnce(
    ViewOnceKey.NOTIFICATIONS_PROMPT
  )(state)

  if (hasPromptedForNotifications) return
  // @ts-ignore
  Navigation.navigate(AppNavigation.Modal.EnableNotificationsPrompt)
  listenerApi.dispatch(setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT))
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
