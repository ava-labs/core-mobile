import { AppStartListening } from 'store/middleware/listener'
import { AppListenerEffectAPI } from 'store'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { ChannelId, getAllChannels } from 'services/notifications/channels'
import notifee from '@notifee/react-native'
import NotificationsService from 'services/notifications/NotificationsService'
import {
  maybePromptEarnNotification,
  selectHasPromptedAfterFirstDelegation,
  setHasPromptedAfterFirstDelegation,
  setNotificationSubscriptions,
  turnOffNotificationsFor,
  turnOnNotificationsFor
} from './slice'

const handleMaybePromptEarnNotification = async (
  action: ReturnType<typeof maybePromptEarnNotification>,
  listenerApi: AppListenerEffectAPI
) => {
  const state = listenerApi.getState()
  const hasPromptedAfterFirstDelegation =
    selectHasPromptedAfterFirstDelegation(state)
  if (!hasPromptedAfterFirstDelegation) {
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
  const channelToCreate = getAllChannels().find(ch => ch.id === channelId)
  if (channelToCreate) {
    await notifee.createChannel(channelToCreate)
  }
  const blockedNotifications =
    await NotificationsService.getBlockedNotifications()
  if (blockedNotifications.has('all') || blockedNotifications.has(channelId)) {
    NotificationsService.openSystemSettings()
  }
}

const handleTurnOffNotificationsFor = async (
  listenerApi: AppListenerEffectAPI,
  channelId: ChannelId
) => {
  listenerApi.dispatch(setNotificationSubscriptions([channelId, false]))
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
}
