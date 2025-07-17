import { AppStartListening } from 'store/types'
import Logger from 'utils/Logger'
import { tokenChangeNotificationService } from 'services/notifications/tokenChange/service'
import { AnyAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store/types'
import {
  selectWatchlistFavoriteIds,
  toggleWatchListFavorite
} from 'store/watchlist'
import FCMService from 'services/fcm/FCMService'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import NotificationsService from 'services/notifications/NotificationsService'
import { selectNotificationSubscription } from 'store/notifications'
import { ChannelId } from 'services/notifications/channels'

const setTokenSubscriptionsForFavorites = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()

  const userHasEnabledPriceAlertNotifications = selectNotificationSubscription(
    ChannelId.PRICE_ALERTS
  )(state)

  if (!userHasEnabledPriceAlertNotifications) {
    return
  }

  const favoriteTokensIds = selectWatchlistFavoriteIds(state)
  Logger.info(
    '[services/notifications/tokenChange/store/listeners.ts] Setting token subscriptions for favorites:',
    favoriteTokensIds
  )

  try {
    // Get deviceArn following the same pattern as other notification services
    const fcmToken = await FCMService.getFCMToken()
    const deviceArn = await registerDeviceToNotificationSender(fcmToken)

    //check if only PRICE_ALERTS notifications are denied
    const blockedNotifications =
      await NotificationsService.getBlockedNotifications()
    if (blockedNotifications.has(ChannelId.PRICE_ALERTS)) {
      //unsubscribe from all
      await tokenChangeNotificationService.setTokenSubscriptions({
        tokens: [],
        deviceArn
      })
      return
    }

    const tokens = favoriteTokensIds.map(id => ({
      internalId: id
    }))

    // Only call the API if we have tokens to subscribe to
    if (tokens.length > 0) {
      await tokenChangeNotificationService.setTokenSubscriptions({
        tokens,
        deviceArn
      })
      Logger.info(
        `[TokenChange] Successfully subscribed to token price alerts for ${tokens.length} tokens`
      )
    } else {
      Logger.info(
        '[TokenChange] No valid internalIds found for favorite tokens, skipping subscription'
      )
    }
  } catch (error) {
    // Handle specific APNS/FCM token errors gracefully
    Logger.error(`[setTokenSubscriptionsForFavorites]${error}`)
  }
}

export const addNotificationsTokenChangeListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: toggleWatchListFavorite,
    effect: setTokenSubscriptionsForFavorites
  })
}
