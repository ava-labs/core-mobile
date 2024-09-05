import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'

export async function registerDeviceToNotificationSender(
  fcmToken: string
): Promise<{ deviceArn: string }> {
  const response = await AppCheckService.fetch(
    'https://core-notification-sender-api.avax-test.network/v1/push/register',
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
