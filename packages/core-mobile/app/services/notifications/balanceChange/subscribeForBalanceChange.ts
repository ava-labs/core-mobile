import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'
import Config from 'react-native-config'

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
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/balance-changes/subscribe',
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
