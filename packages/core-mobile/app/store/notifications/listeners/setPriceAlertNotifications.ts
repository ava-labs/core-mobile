import { AnyAction } from '@reduxjs/toolkit'
import FCMService from 'services/fcm/FCMService'
import { ChannelId } from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { setPriceAlertSubscriptions } from 'services/notifications/priceAlert/setPriceAlertSubscriptions'
import { unsubscribeForPriceAlert } from 'services/notifications/priceAlert/unsubscribeForPriceAlert'
import { registerDeviceToNotificationSender } from 'services/notifications/registerDeviceToNotificationSender'
import { selectNotificationSubscription } from 'store/notifications'
import { AppListenerEffectAPI } from 'store/types'
import { selectWatchlistFavoriteIds } from 'store/watchlist'
import Logger from 'utils/Logger'

export const setPriceAlertNotifications = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()

  const userHasEnabledPriceAlertNotifications = selectNotificationSubscription(
    ChannelId.FAV_TOKEN_PRICE_ALERTS
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

    //check if only FAV_TOKEN_PRICE_ALERTS notifications are denied
    const blockedNotifications =
      await NotificationsService.getBlockedNotifications()
    if (blockedNotifications.has(ChannelId.FAV_TOKEN_PRICE_ALERTS)) {
      await unsubscribeForPriceAlert()
      return
    }

    const tokens = favoriteTokensIds.map(id => ({
      internalId: id
    }))

    await setPriceAlertSubscriptions({
      tokens,
      deviceArn
    })

    Logger.info(
      `[TokenChange] Successfully subscribed to token price alerts for ${tokens.length} tokens`
    )
  } catch (error) {
    // Handle specific APNS/FCM token errors gracefully
    Logger.error(`[setTokenSubscriptionsForFavorites]${error}`)
  }
}
