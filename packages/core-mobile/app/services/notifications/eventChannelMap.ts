import { BalanceChangeEvents, NewsEvents } from 'services/fcm/types'
import { ChannelId, DEFAULT_ANDROID_CHANNEL } from './channels'

/**
 * Map from a notification's `event` string (the FCM payload's `data.event`)
 * to the on-device channel that displays it.
 *
 * Lives in its own module rather than `channels.ts` or `FCMService.ts`:
 *
 * - Putting it in `channels.ts` would create a cycle, since `channels.ts`
 *   would have to import from `services/fcm/types`, which already imports
 *   `ChannelId` from `channels.ts` for its Zod schema.
 * - Putting it in `FCMService.ts` was the original layout, but that made
 *   `NotificationsService` import from `FCMService` (which already imports
 *   `NotificationsService.displayNotification`) — a real cycle that worked
 *   only by accident of evaluation order.
 *
 * This module imports from both ends and is imported by neither.
 */
export const EVENT_TO_CH_ID: Record<string, ChannelId> = {
  [BalanceChangeEvents.ALLOWANCE_APPROVED]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_SPENT]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_RECEIVED]: ChannelId.BALANCE_CHANGES,
  [BalanceChangeEvents.BALANCES_TRANSFERRED]: ChannelId.BALANCE_CHANGES,
  [NewsEvents.MARKET_NEWS]: ChannelId.MARKET_NEWS,
  [NewsEvents.OFFERS_AND_PROMOTIONS]: ChannelId.OFFERS_AND_PROMOTIONS,
  [NewsEvents.PRICE_ALERTS]: ChannelId.PRICE_ALERTS,
  [NewsEvents.PRODUCT_ANNOUNCEMENTS]: ChannelId.PRODUCT_ANNOUNCEMENTS
}

/**
 * Pure helper that resolves the channel id for a `PushNotificationPressed`
 * analytics event. Centralizes the precedence rule shared by every capture
 * site (foreground, warm-background notifee, cold-start notifee, iOS
 * background FCM):
 *
 *   1. android.channelId on the displayed notifee notification, if any
 *      (Android data-only path — the notifee `Notification.android.channelId`
 *      is the most authoritative source since it's set by us at display time)
 *   2. data.channelId carried in the FCM payload (NEWS notifications)
 *   3. EVENT_TO_CH_ID lookup against the event string
 *   4. DEFAULT_ANDROID_CHANNEL as a final fallback
 *
 * Accepts loosely-typed input because notification data shapes vary across
 * the FCM SDK, notifee, and the legacy `notification` payload — narrowing
 * happens here so callers don't need unsafe `as string` casts.
 */
export const resolveChannelId = (args: {
  androidChannelId?: string
  data?: Record<string, unknown>
  fallbackEvent?: string
}): string => {
  const { androidChannelId, data, fallbackEvent } = args
  const dataChannelId =
    typeof data?.channelId === 'string' && data.channelId.length > 0
      ? data.channelId
      : undefined
  const event =
    (typeof data?.event === 'string' ? data.event : undefined) ?? fallbackEvent
  return (
    androidChannelId ??
    dataChannelId ??
    (event ? EVENT_TO_CH_ID[event] : undefined) ??
    DEFAULT_ANDROID_CHANNEL
  )
}
