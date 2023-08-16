import { AppStartListening } from 'store/middleware/listener'
import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import notifee from '@notifee/react-native'
import NotificationsService from 'services/notifications/NotificationsService'
import { onAppLocked, onAppUnlocked } from 'store/app'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import {
  scheduleStakingCompleteNotifications,
  maybePromptEarnNotification,
  selectHasPromptedAfterFirstDelegation,
  selectNotificationSubscription,
  setHasPromptedAfterFirstDelegation,
  setNotificationSubscriptions,
  turnOffNotificationsFor,
  turnOnNotificationsFor
} from './slice'
import { StakeCompleteNotification } from './types'

const handleMaybePromptEarnNotification = async (
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

const handleTurnOnNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  channelId: ChannelId
) => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, true]))
  const channelToCreate = notificationChannels.find(ch => ch.id === channelId)
  if (channelToCreate) {
    await notifee.createChannel(channelToCreate)
  }
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  if (blockedNotifications.has(channelId)) {
    NotificationsService.openSystemSettings()
  }
}

const handleTurnOffNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  channelId: ChannelId
) => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, false]))
}

const handleScheduleStakingCompleteNotifications = async (
  listenerApi: AppListenerEffectAPI,
  stakeCompleteNotification: StakeCompleteNotification[]
) => {
  const state = listenerApi.getState()
  const isDeveloperMode = state.settings.advanced.developerMode
  await NotificationsService.updateStakeCompleteNotification(
    stakeCompleteNotification,
    isDeveloperMode
  )
}

const handleResetNotificationBadgeCount = async () => {
  await NotificationsService.setBadgeCount(0)
}

const handleNotificationCleanup = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const isStakeCompleteNotificationEnabled =
    state.notifications.notificationSubscriptions[ChannelId.STAKING_COMPLETE]
  const isStakeCompleteNotificationBlocked =
    await NotificationsService.isStakeCompleteNotificationBlocked()
  if (
    isStakeCompleteNotificationBlocked ||
    !isStakeCompleteNotificationEnabled
  ) {
    await NotificationsService.cancelAllNotifications()
  }
}

export const addNotificationsListeners = (
  startListening: AppStartListening
) => {
  startListening({
    actionCreator: maybePromptEarnNotification,
    effect: handleMaybePromptEarnNotification
  })

  startListening({
    actionCreator: turnOnNotificationsFor,
    effect: async (action, listenerApi) => {
      await handleTurnOnNotificationsFor(listenerApi, action.payload.channelId)
    }
  })

  startListening({
    actionCreator: turnOffNotificationsFor,
    effect: async (action, listenerApi) => {
      await handleTurnOffNotificationsFor(listenerApi, action.payload.channelId)
    }
  })

  startListening({
    actionCreator: scheduleStakingCompleteNotifications,
    effect: async (action, listenerApi) => {
      await handleScheduleStakingCompleteNotifications(
        listenerApi,
        action.payload
      )
    }
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: handleResetNotificationBadgeCount
  })

  startListening({
    matcher: isAnyOf(onAppUnlocked, onAppLocked),
    effect: handleNotificationCleanup
  })
}
