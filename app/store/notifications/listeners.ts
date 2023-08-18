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
import { onAppUnlocked } from 'store/app'
import { Action } from '@reduxjs/toolkit'
import EarnService from 'services/earn/EarnService'
import Logger from 'utils/Logger'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectAccounts } from 'store/account'
import { selectIsEarnBlocked } from 'store/posthog'
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
  handleNotificationCleanup(listenerApi)
}

const handleScheduleStakingCompleteNotifications = async (
  listenerApi: AppListenerEffectAPI,
  stakeCompleteNotification: StakeCompleteNotification[]
) => {
  const state = listenerApi.getState()
  const isEarnBlocked = selectIsEarnBlocked(state)
  if (isEarnBlocked) return

  const notificationDisabled = await isStakeCompleteNotificationDisabled(
    listenerApi
  )
  if (notificationDisabled) {
    Logger.info(
      'user has disabled either in-app notification or system-level notification, no notification will be scheduled'
    )
    return
  }

  await NotificationsService.updateStakeCompleteNotification(
    stakeCompleteNotification
  )
}

const handleScheduleNotificationsForAllAccounts = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const isEarnBlocked = selectIsEarnBlocked(state)
  if (isEarnBlocked) return

  const notificationDisabled = await isStakeCompleteNotificationDisabled(
    listenerApi
  )

  if (notificationDisabled) {
    Logger.info(
      'user has disabled either in-app notification or system-level notification, no notification will be scheduled'
    )
    return
  }

  setTimeout(async () => {
    const isDeveloperMode = selectIsDeveloperMode(state)
    const accounts = selectAccounts(state)

    const tranformedTransactions =
      await EarnService.getTransformedStakesForAllAccounts({
        isDeveloperMode,
        accounts
      })
    if (tranformedTransactions && tranformedTransactions.length > 0) {
      await NotificationsService.updateStakeCompleteNotification(
        tranformedTransactions
      )
    }
  }, 5000)
}

const handleNotificationCleanup = async (listenerApi: AppListenerEffectAPI) => {
  const state = listenerApi.getState()
  const isEarnBlocked = selectIsEarnBlocked(state)
  if (isEarnBlocked) return

  await NotificationsService.setBadgeCount(0)
  const notificationDisabled = await isStakeCompleteNotificationDisabled(
    listenerApi
  )
  if (notificationDisabled) {
    Logger.info(
      'user has disabled either in-app notification or system-level notification, cancel all pending notifications.'
    )
    await NotificationsService.cancelAllNotifications()
  }
}

const isStakeCompleteNotificationDisabled = async (
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()

  const isInAppNotificationEnabled = selectNotificationSubscription(
    ChannelId.STAKING_COMPLETE
  )(state)

  const isSystemStakeCompleteNotificationBlocked =
    await NotificationsService.isStakeCompleteNotificationBlocked()
  return !isInAppNotificationEnabled || isSystemStakeCompleteNotificationBlocked
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
    effect: async (_, listenerApi) =>
      await handleNotificationCleanup(listenerApi)
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: handleScheduleNotificationsForAllAccounts
  })
}
