import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked, onLogOut, onRehydrationComplete } from 'store/app'
import { setAccount, setAccounts, setNonActiveAccounts } from 'store/account'
import { handleMaybePromptBalanceNotification } from 'store/notifications/listeners/handleMaybePromptBalanceNotification'
import { subscribeBalanceChangeNotifications } from 'store/notifications/listeners/subscribeBalanceChangeNotifications'
import Logger from 'utils/Logger'
import { AnyAction, isAnyOf, PayloadAction } from '@reduxjs/toolkit'
import { manageForegroundNotificationSubscription } from 'store/notifications/listeners/manageForegroundNotificationSubscription'
import { unsubscribeBalanceChangeNotifications } from 'store/notifications/listeners/unsubscribeBalanceChangeNotifications'
import { setFeatureFlags } from 'store/posthog/slice'
import { FeatureFlags, FeatureGates } from 'services/posthog/types'
import type { Action } from 'redux'
import { ChannelId } from 'services/notifications/channels'
import { handleProcessNotificationData } from 'store/notifications/listeners/handleProcessNotificationData'
import {
  scheduleStakingCompleteNotifications,
  maybePromptEarnNotification,
  turnOffNotificationsFor,
  turnOnNotificationsFor,
  maybePromptBalanceNotification,
  onFcmTokenChange,
  processNotificationData
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
      onBalanceChangeNotificationsEnabled
    ),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        // avoid subscribing when previous flag is already true
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.BALANCE_CHANGE_NOTIFICATIONS
          ]
        if (previousFlag === true) return
      }

      await subscribeBalanceChangeNotifications(listenerApi).catch(reason => {
        Logger.error(
          `[listeners.ts][subscribeBalanceChangeNotifications]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(
      onLogOut,
      onNotificationsTurnedOffForBalanceChange,
      onBalanceChangeNotificationsDisabled
    ),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.BALANCE_CHANGE_NOTIFICATIONS
          ]
        // avoid unsubscribing when previous flag is already false
        if (previousFlag === false) return
      }

      await unsubscribeBalanceChangeNotifications().catch(reason => {
        Logger.error(
          `[listeners.ts][unsubscribeBalanceChangeNotifications]${reason}`
        )
      })
    }
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

  startListening({
    actionCreator: processNotificationData,
    effect: async (action: AnyAction, listenerApi) =>
      await handleProcessNotificationData(
        listenerApi,
        action.payload.data
      ).catch(reason => {
        Logger.error(
          `[notifications/listeners/listeners.ts][handleProcessNotificationData]${reason}`
        )
      })
  })
}

const onNotificationsTurnedOffForBalanceChange = {
  match: (action: Action<unknown>): action is PayloadAction => {
    return (
      action.type === turnOffNotificationsFor.type &&
      (action as PayloadAction<{ channelId: ChannelId }>).payload.channelId ===
        ChannelId.BALANCE_CHANGES
    )
  }
}

const onBalanceChangeNotificationsEnabled = {
  match: (action: Action<unknown>): action is PayloadAction => {
    if (action.type === setFeatureFlags.type) {
      const setFeatureFlagsAction = action as PayloadAction<FeatureFlags>
      return !!setFeatureFlagsAction.payload[
        FeatureGates.BALANCE_CHANGE_NOTIFICATIONS
      ]
    }
    return false
  }
}
const onBalanceChangeNotificationsDisabled = {
  match: (action: Action<unknown>): action is PayloadAction => {
    if (action.type === setFeatureFlags.type) {
      const setFeatureFlagsAction = action as PayloadAction<FeatureFlags>
      return !setFeatureFlagsAction.payload[
        FeatureGates.BALANCE_CHANGE_NOTIFICATIONS
      ]
    }
    return false
  }
}
