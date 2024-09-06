import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'
import Config from 'react-native-config'

export async function registerDeviceToNotificationSender(
  fcmToken: string
): Promise<{ deviceArn: string }> {
  const response = await AppCheckService.fetch(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/register',
    JSON.stringify({
      deviceToken: fcmToken,
      appType: 'CORE_MOBILE_APP'
    })
  ).catch(error => {
    Logger.error(`[register.ts][registerDevice]${error}`)
    throw new Error(error)
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
