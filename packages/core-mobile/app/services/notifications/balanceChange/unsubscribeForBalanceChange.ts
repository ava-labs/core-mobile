import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'

export async function unSubscribeForBalanceChange({
  deviceArn
}: {
  deviceArn: string
}): Promise<{ message: 'ok' }> {
  const response = await AppCheckService.fetch(
    'https://core-notification-sender-api.avax-test.network/v1/push/balance-changes/unsubscribe',
    JSON.stringify({
      deviceArn
    })
  ).catch(error => {
    Logger.error(`[unsubscribeForBalanceChange.ts][unsubscribe]${error}`)
    throw error
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
