import Logger from 'utils/Logger'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'

export async function registerDeviceToNotificationSender(
  fcmToken: string
): Promise<{ deviceArn: string }> {
  const response = await fetchWithAppCheck(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/register',
    JSON.stringify({
      deviceToken: fcmToken,
      appType: 'CORE_MOBILE_APP'
    })
  ).catch(error => {
    Logger.error(
      `[registerDeviceToNotificationSender.ts][registerDevice]${error}`
    )
    throw error
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
