import { registerAndGetDeviceArn } from 'services/notifications/registerDeviceToNotificationSender'
import { unSubscribeForBalanceChange } from 'services/notifications/balanceChange/unsubscribeForBalanceChange'

export async function unsubscribeBalanceChangeNotifications(): Promise<void> {
  const deviceArn = await registerAndGetDeviceArn()
  await unSubscribeForBalanceChange({ deviceArn })
}
