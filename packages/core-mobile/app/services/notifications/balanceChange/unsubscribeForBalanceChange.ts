import Logger from 'utils/Logger'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'

export async function unSubscribeForBalanceChange({
  deviceArn
}: {
  deviceArn: string
}): Promise<{ message: 'ok' }> {
  const response = await fetchWithAppCheck({
    url:
      Config.NOTIFICATION_SENDER_API_URL +
      '/v1/push/balance-changes/unsubscribe',
    bodyJson: JSON.stringify({
      deviceArn
    })
  }).catch(error => {
    Logger.error(`[unsubscribeForBalanceChange.ts][unsubscribe]${error}`)
    throw error
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
