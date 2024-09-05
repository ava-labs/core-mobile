import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'

export async function subscribeForBalanceChange({
  deviceArn,
  chainIds,
  addresses
}: {
  deviceArn: string
  chainIds: string[]
  addresses: string[]
}): Promise<{ message: 'ok' }> {
  const response = await AppCheckService.fetch(
    'https://core-notification-sender-api.avax-test.network/v1/push/balance-changes/subscribe',
    JSON.stringify({
      deviceArn,
      chainIds,
      addresses
    })
  ).catch(error => {
    Logger.error(`[subscribe.ts][subscribe]${error}`)
    throw new Error(error)
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
