import { AppStartListening } from 'store/types'
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
import { ChannelId, NewsChannelId } from 'services/notifications/channels'
import { handleProcessNotificationData } from 'store/notifications/listeners/handleProcessNotificationData'
import { promptEnableNotifications } from 'store/notifications'
import { toggleWatchListFavorite } from 'store/watchlist'
import { setPriceAlertNotifications } from 'store/notifications/listeners/setPriceAlertNotifications'
import { unsubscribeForPriceAlert } from 'services/notifications/priceAlert/unsubscribeForPriceAlert'
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
      turnOnAllNotifications,
      onNotificationsEnabled,
      onNotificationsTurnedOnForBalanceChange
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
      turnOnAllNotifications,
      onNotificationsEnabled,
      onNotificationsTurnedOnForNews
    ),
    effect: async (_, listenerApi) => {
      await subscribeNewsNotifications(listenerApi).catch(reason => {
        Logger.error(`[listeners.ts][subscribeNewsNotifications]${reason}`)
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForBalanceChange),
    effect: async () => {
      await unsubscribeBalanceChangeNotifications().catch(reason => {
        Logger.error(
          `[listeners.ts][unsubscribeBalancheChangeNotifications]${reason}`
        )
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForNews),
    effect: async action => {
      const channelId = (action as PayloadAction<{ channelId: NewsChannelId }>)
        .payload.channelId
      await unsubscribeNewsNotifications({ channelIds: [channelId] }).catch(
        reason => {
          Logger.error(
            `[listeners.ts][unsubscribeNewsNotifications:priceAlerts]${reason}`
          )
        }
      )
    }
  })

  startListening({
    matcher: isAnyOf(onLogOut, onNotificationsDisabled),
    effect: async () => {
      await unsubscribeAllNotifications().catch(reason => {
        Logger.error(`[listeners.ts][unsubscribeAllNotifications]${reason}`)
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

  startListening({
    actionCreator: toggleWatchListFavorite,
    effect: setPriceAlertNotifications
  })

  startListening({
    matcher: isAnyOf(
      onRehydrationComplete,
      onFcmTokenChange,
      turnOnAllNotifications,
      onNotificationsEnabled,
      onNotificationsTurnedOnForFavTokenPriceAlerts
    ),
    effect: setPriceAlertNotifications
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForFavTokenPriceAlerts),
    effect: async () => {
      await unsubscribeForPriceAlert().catch(reason => {
        Logger.error(`[listeners.ts][unsubscribeForPriceAlert]${reason}`)
      })
    }
  })

  startListening({
    matcher: isAnyOf(onNotificationsTurnedOffForNews),
    effect: async () => {
      await unsubscribeForPriceAlert().catch(reason => {
        Logger.error(`[listeners.ts][unsubscribeForPriceAlert]${reason}`)
      })
    }
  })
}

const onNotificationsTurnedOnForBalanceChange = {
  match: (
    action: Action<unknown>
  ): action is PayloadAction<{ channelId: ChannelId }> => {
    if (!turnOnNotificationsFor.match(action)) {
      return false
    }

    return action.payload.channelId === ChannelId.BALANCE_CHANGES
  }
}

const onNotificationsTurnedOnForNews = {
  match: (
    action: Action<unknown>
  ): action is PayloadAction<{ channelId: ChannelId }> => {
    if (!turnOnNotificationsFor.match(action)) {
      return false
    }

    const channelId = action.payload.channelId

    return (
      channelId === ChannelId.MARKET_NEWS ||
      channelId === ChannelId.OFFERS_AND_PROMOTIONS ||
      channelId === ChannelId.PRODUCT_ANNOUNCEMENTS ||
      channelId === ChannelId.PRICE_ALERTS
    )
  }
}

const onNotificationsTurnedOffForBalanceChange = {
  match: (
    action: Action<unknown>
  ): action is PayloadAction<{ channelId: ChannelId }> => {
    if (!turnOffNotificationsFor.match(action)) {
      return false
    }

    return action.payload.channelId === ChannelId.BALANCE_CHANGES
  }
}

const onNotificationsTurnedOffForNews = {
  match: (
    action: Action<unknown>
  ): action is PayloadAction<{ channelId: ChannelId }> => {
    if (!turnOffNotificationsFor.match(action)) {
      return false
    }

    const channelId = action.payload.channelId

    return (
      channelId === ChannelId.MARKET_NEWS ||
      channelId === ChannelId.OFFERS_AND_PROMOTIONS ||
      channelId === ChannelId.PRODUCT_ANNOUNCEMENTS ||
      channelId === ChannelId.PRICE_ALERTS
    )
  }
}

const onNotificationsTurnedOnForFavTokenPriceAlerts = {
  match: (
    action: Action<unknown>
  ): action is PayloadAction<{ channelId: ChannelId }> => {
    if (!turnOnNotificationsFor.match(action)) {
      return false
    }

    return action.payload.channelId === ChannelId.FAV_TOKEN_PRICE_ALERTS
  }
}

const onNotificationsTurnedOffForFavTokenPriceAlerts = {
  match: (
    action: Action<unknown>
  ): action is PayloadAction<{ channelId: ChannelId }> => {
    if (!turnOffNotificationsFor.match(action)) {
      return false
    }

    return action.payload.channelId === ChannelId.FAV_TOKEN_PRICE_ALERTS
  }
}

const onNotificationsEnabled = {
  match: (action: Action<unknown>): action is PayloadAction<FeatureFlags> => {
    if (setFeatureFlags.match(action)) {
      const setFeatureFlagsAction = action
      return !!setFeatureFlagsAction.payload[FeatureGates.ALL_NOTIFICATIONS]
    }

    return false
  }
}
const onNotificationsDisabled = {
  match: (action: Action<unknown>): action is PayloadAction<FeatureFlags> => {
    if (setFeatureFlags.match(action)) {
      const setFeatureFlagsAction = action
      return !setFeatureFlagsAction.payload[FeatureGates.ALL_NOTIFICATIONS]
    }

    return false
  }
}
