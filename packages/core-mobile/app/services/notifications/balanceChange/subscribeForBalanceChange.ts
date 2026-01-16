import Logger from 'utils/Logger'
import Config from 'react-native-config'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'

export async function subscribeForBalanceChange({
  deviceArn,
  chainIds,
  addresses
}: {
  deviceArn: string
  chainIds: string[]
  addresses: string[]
}): Promise<{ message: 'ok' }> {
  const response = await appCheckPostJson(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/balance-changes/subscribe',
    JSON.stringify({
      deviceArn,
      chainIds,
      addresses
    })
  ).catch(error => {
    Logger.error(`[subscribeForBalanceChange.ts][subscribe]${error}`)
    throw new Error(error)
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
