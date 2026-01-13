import { setPriceAlertSubscriptions } from 'services/notifications/priceAlert/setPriceAlertSubscriptions'
import { registerAndGetDeviceArn } from 'services/notifications/registerDeviceToNotificationSender'

export async function unsubscribeForPriceAlert(): Promise<void> {
  const deviceArn = await registerAndGetDeviceArn()
  await setPriceAlertSubscriptions({ tokens: [], deviceArn })
}
