import Logger from 'utils/Logger'
import Config from 'react-native-config'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'

export async function unSubscribeForBalanceChange({
  deviceArn
}: {
  deviceArn: string
}): Promise<{ message: 'ok' }> {
  const response = await appCheckPostJson(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/balance-changes/unsubscribe',
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
