import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked, onLogOut, onRehydrationComplete } from 'store/app'
import { setAccount, setAccounts, setNonActiveAccounts } from 'store/account'
import { handleMaybePromptBalanceNotification } from 'store/notifications/listeners/handleMaybePromptBalanceNotification'
import { subscribeBalanceChangeNotifications } from 'store/notifications/listeners/subscribeBalanceChangeNotifications'
import Logger from 'utils/Logger'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { manageForegroundNotificationSubscription } from 'store/notifications/listeners/manageForegroundNotificationSubscription'
import { unsubscribeBalanceChangeNotifications } from 'store/notifications/listeners/unsubscribeBalanceChangeNotifications'
import { setFeatureFlags } from 'store/posthog'
import {
  scheduleStakingCompleteNotifications,
  maybePromptEarnNotification,
  turnOffNotificationsFor,
  turnOnNotificationsFor,
  maybePromptBalanceNotification,
  onFcmTokenChange
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
    effect: async (action: AnyAction, listenerApi) => {
      await handleTurnOnNotificationsFor(listenerApi, action.payload.channelId)
    }
  })

  startListening({
    actionCreator: turnOffNotificationsFor,
    effect: async (action: AnyAction, listenerApi) => {
      await handleTurnOffNotificationsFor(listenerApi, action.payload.channelId)
    }
  })

  startListening({
    actionCreator: scheduleStakingCompleteNotifications,
    effect: async (action: AnyAction, listenerApi) => {
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

  startListening({
    matcher: isAnyOf(
      onRehydrationComplete,
      setAccounts,
      setNonActiveAccounts,
      setAccount,
      onFcmTokenChange,
      turnOnNotificationsFor,
      setFeatureFlags
    ),
    effect: async (action, listenerApi) =>
      await subscribeBalanceChangeNotifications(action, listenerApi).catch(
        reason => {
          Logger.error(
            `[listeners.ts][subscribeBalanceChangeNotifications]${reason}`
          )
        }
      )
  })

  startListening({
    matcher: isAnyOf(onLogOut, turnOffNotificationsFor, setFeatureFlags),
    effect: async action =>
      await unsubscribeBalanceChangeNotifications(action).catch(reason => {
        Logger.error(
          `[listeners.ts][unsubscribeBalanceChangeNotifications]${reason}`
        )
      })
  })

  startListening({
    matcher: isAnyOf(onRehydrationComplete),
    effect: async (_, listenerApi) =>
      await manageForegroundNotificationSubscription(listenerApi).catch(
        reason => {
          Logger.error(
            `[listeners.ts][manageForegroundNotificationSubscription]${reason}`
          )
        }
      )
  })
}
