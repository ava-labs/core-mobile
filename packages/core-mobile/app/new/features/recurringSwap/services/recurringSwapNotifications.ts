import Config from 'react-native-config'
import { registerAndGetDeviceArn } from 'services/notifications/registerDeviceToNotificationSender'
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
}

export async function subscribeRecurringSwapNotifications(
  subscription: RecurringSwapNotificationSubscription
): Promise<void> {
  const deviceArn = await registerAndGetDeviceArn()
  const response = await appCheckPostJson(
    Config.NOTIFICATION_SENDER_API_URL + RECURRING_SWAP_SUBSCRIBE_PATH,
    JSON.stringify({
      deviceArn,
      orderId: subscription.orderId
    })
  )

  if (!response.ok) {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
