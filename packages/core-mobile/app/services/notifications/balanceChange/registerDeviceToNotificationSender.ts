import Logger from 'utils/Logger'
import AppCheckService from 'services/fcm/AppCheckService'

export async function registerDeviceToNotificationSender(
  fcmToken: string
): Promise<{ deviceArn: string }> {
  const appCheckToken = await AppCheckService.getToken()
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Firebase-AppCheck': appCheckToken.token
    },
    body: JSON.stringify({
      deviceToken: fcmToken,
      appType: 'CORE_MOBILE_APP'
    })
  }

  const response = await fetch(
    'https://core-notification-sender-api.avax-test.network/v1/push/register',
    options
  ).catch(error => {
    Logger.error(
      `[packages/core-mobile/app/services/notifications/register.ts][registerDevice]${error}`
    )
    throw new Error(error)
  })
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
