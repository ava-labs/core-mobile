import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'

// Backend (core-notification-sender): see Sarp's PR
// https://github.com/ava-labs/core-notification-sender-service/pull/172
//   - Subscription is per (orderId, deviceArn). Re-subscribing the same
//     device is an idempotent reactivation, so retries on app restart /
//     network blip are safe.
//   - No client-side unsubscribe — teardown is event-driven (terminal
//     status / executedOrders ≥ numberOfOrders / dead device endpoint),
//     owned by the webhook.
//   - AppCheck-authed, matches the balance-changes subscribe endpoint
//     pattern so the auth + retry semantics align with the rest of the
//     notification-sender clients.
const RECURRING_SWAP_SUBSCRIBE_PATH = '/v1/push/recurring-swaps/subscribe'

type RecurringSwapNotificationSubscription = {
  orderId: string
  // Resolved once per batch by the caller (`ensureOrderSubscriptions`) and
  // reused across orders, mirroring the balance-change subscribe flow — so a
  // multi-order snapshot triggers one `/v1/push/register`, not one per order.
  deviceArn: string
}

export async function subscribeForRecurringSwap(
  subscription: RecurringSwapNotificationSubscription
): Promise<void> {
  const { deviceArn, orderId } = subscription
  const response = await appCheckPostJson(
    Config.NOTIFICATION_SENDER_API_URL + RECURRING_SWAP_SUBSCRIBE_PATH,
    JSON.stringify({
      deviceArn,
      orderId
    })
  ).catch(error => {
    Logger.error('[subscribeForRecurringSwap.ts][subscribe]', error)
    throw error instanceof Error ? error : new Error(String(error))
  })

  if (!response.ok) {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
