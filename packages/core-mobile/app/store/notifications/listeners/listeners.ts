import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked, onLogOut, onRehydrationComplete } from 'store/app'
import { setAccount, setAccounts, setNonActiveAccounts } from 'store/account'
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
import { promptEnableNotifications } from 'store/notifications'
import {
  onFcmTokenChange,
  processNotificationData,
  scheduleStakingCompleteNotifications,
  turnOffNotificationsFor,
  turnOnAllNotifications,
  turnOnNotificationsFor
} from '../slice'
import { handleScheduleStakingCompleteNotifications } from './handleScheduleStakingCompleteNotifications'
import { handleNotificationCleanup } from './handleNotificationCleanup'
import { handleTurnOnNotificationsFor } from './handleTurnOnNotificationsFor'
import { handleTurnOffNotificationsFor } from './handleTurnOffNotificationsFor'
import { scheduleNotificationsForActiveStakesPeriodically } from './scheduleNotificationsForActiveStakesPeriodically'
import { handlePromptNotifications } from './handlePromptNotifications'
import { handleTurnOnAllNotifications } from './handleTurnOnAllNotifications'
import { manageNotificationChannelsCreation } from './manageNotificationChannelsCreation'
import { unsubscribeAllNotifications } from './unsubscribeAllNotifications'
import { unsubscribeNewsNotifications } from './unsubscribeNewsNotifications'
import { subscribeNewsNotifications } from './subscribeNewsNotifications'

export const addNotificationsListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: promptEnableNotifications,
    effect: handlePromptNotifications
  })

  startListening({
    actionCreator: turnOnNotificationsFor,
    effect: async (action: AnyAction, listenerApi) => {
      await handleTurnOnNotificationsFor(
        listenerApi,
        action.payload.channelId
      ).catch(Logger.error)
    }
  })

  startListening({
    actionCreator: turnOffNotificationsFor,
    effect: async (action: AnyAction, listenerApi) => {
      await handleTurnOffNotificationsFor(listenerApi, action.payload.channelId)
    }
  })

  startListening({
    actionCreator: turnOnAllNotifications,
    effect: async (_, listenerApi) => {
      await handleTurnOnAllNotifications(listenerApi).catch(Logger.error)
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
      onNotificationsEnabled,
      turnOnAllNotifications
    ),
    effect: async (_, listenerApi) => {
      await subscribeBalanceChangeNotifications(listenerApi).catch(reason => {
        Logger.error(
          `[listeners.ts][subscribeBalanceChangeNotifications]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(
      onRehydrationComplete,
      onFcmTokenChange,
      turnOnNotificationsFor,
      onNotificationsEnabled,
      turnOnAllNotifications
    ),
    effect: async (_, listenerApi) => {
      await subscribeNewsNotifications(listenerApi).catch(reason => {
        Logger.error(
          `[listeners.ts][subscribeBalanceChangeNotifications]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForMarketNews),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.ALL_NOTIFICATIONS
          ]
        // avoid unsubscribing when previous flag is already falsy
        if (!previousFlag) return
      }

      await unsubscribeNewsNotifications({
        channelIds: [ChannelId.MARKET_NEWS]
      }).catch(reason => {
        Logger.error(
          `[listeners.ts][unsubscribeNewsNotifications:marketNews]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForOfferAndPromotions),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.ALL_NOTIFICATIONS
          ]
        // avoid unsubscribing when previous flag is already falsy
        if (!previousFlag) return
      }

      await unsubscribeNewsNotifications({
        channelIds: [ChannelId.OFFERS_AND_PROMOTIONS]
      }).catch(reason => {
        Logger.error(
          `[listeners.ts][unsubscribeNewsNotifications:offersAndPromotions]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForProductAnnouncements),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.ALL_NOTIFICATIONS
          ]
        // avoid unsubscribing when previous flag is already falsy
        if (!previousFlag) return
      }

      await unsubscribeNewsNotifications({
        channelIds: [ChannelId.PRODUCT_ANNOUNCEMENTS]
      }).catch(reason => {
        Logger.error(
          `[listeners.ts][unsubscribeNewsNotifications:productAnnouncements]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(onLogOut, onNotificationsDisabled),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.ALL_NOTIFICATIONS
          ]
        // avoid unsubscribing when previous flag is already falsy
        if (!previousFlag) return
      }

      await unsubscribeAllNotifications().catch(reason => {
        Logger.error(`[listeners.ts][unsubscribeAllNotifications]${reason}`)
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForBalanceChange),
    effect: async (action, listenerApi) => {
      if (action.type === setFeatureFlags.type) {
        const previousFlag =
          listenerApi.getOriginalState().posthog.featureFlags[
            FeatureGates.ALL_NOTIFICATIONS
          ]
        // avoid unsubscribing when previous flag is already falsy
        if (!previousFlag) return
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
    matcher: isAnyOf(onRehydrationComplete),
    effect: async (_, listenerApi) =>
      await manageNotificationChannelsCreation(listenerApi).catch(reason => {
        Logger.error(
          `[listeners.ts][manageNotificationChannelsCreation]${reason}`
        )
      })
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

const onNotificationsTurnedOffForMarketNews = {
  match: (action: Action<unknown>): action is PayloadAction => {
    return (
      action.type === turnOffNotificationsFor.type &&
      (action as PayloadAction<{ channelId: ChannelId }>).payload.channelId ===
        ChannelId.MARKET_NEWS
    )
  }
}

const onNotificationsTurnedOffForOfferAndPromotions = {
  match: (action: Action<unknown>): action is PayloadAction => {
    return (
      action.type === turnOffNotificationsFor.type &&
      (action as PayloadAction<{ channelId: ChannelId }>).payload.channelId ===
        ChannelId.OFFERS_AND_PROMOTIONS
    )
  }
}

const onNotificationsTurnedOffForProductAnnouncements = {
  match: (action: Action<unknown>): action is PayloadAction => {
    return (
      action.type === turnOffNotificationsFor.type &&
      (action as PayloadAction<{ channelId: ChannelId }>).payload.channelId ===
        ChannelId.PRODUCT_ANNOUNCEMENTS
    )
  }
}

const onNotificationsEnabled = {
  match: (action: Action<unknown>): action is PayloadAction => {
    if (action.type === setFeatureFlags.type) {
      const setFeatureFlagsAction = action as PayloadAction<FeatureFlags>
      return !!setFeatureFlagsAction.payload[FeatureGates.ALL_NOTIFICATIONS]
    }
    return false
  }
}
const onNotificationsDisabled = {
  match: (action: Action<unknown>): action is PayloadAction => {
    if (action.type === setFeatureFlags.type) {
      const setFeatureFlagsAction = action as PayloadAction<FeatureFlags>
      return !setFeatureFlagsAction.payload[FeatureGates.ALL_NOTIFICATIONS]
    }
    return false
  }
}
