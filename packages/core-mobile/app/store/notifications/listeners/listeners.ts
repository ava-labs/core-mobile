import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked } from 'store/app'
import { handleMaybePromptBalanceNotification } from 'store/notifications/listeners/handleMaybePromptBalanceNotification'
import {
  scheduleStakingCompleteNotifications,
  maybePromptEarnNotification,
  turnOffNotificationsFor,
  turnOnNotificationsFor
} from '../slice'
import { handleScheduleStakingCompleteNotifications } from './handleScheduleStakingCompleteNotifications'
import { handleMaybePromptEarnNotification } from './handleMaybePromptEarnNotification'
import { handleNotificationCleanup } from './handleNotificationCleanup'
import { handleTurnOnNotificationsFor } from './handleTurnOnNotificationsFor'
import { handleTurnOffNotificationsFor } from './handleTurnOffNotificationsFor'
import { scheduleNotificationsForActiveStakesPeriodically } from './scheduleNotificationsForActiveStakesPeriodically'

export const addNotificationsListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: maybePromptEarnNotification,
    effect: handleMaybePromptEarnNotification
  })
  startListening({
    actionCreator: maybePromptBalanceNotification,
    effect: handleMaybePromptBalanceNotification
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
    effect: scheduleNotificationsForActiveStakesPeriodically
  })
}
