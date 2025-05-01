import Logger from 'utils/Logger'
import Config from 'react-native-config'
import fetchWithAppCheck from 'utils/httpClient'
import { Platform } from 'react-native'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'

export async function registerDeviceToNotificationSender(
  fcmToken: string
): Promise<string> {
  const storedDeviceArn = commonStorage.getString(
    StorageKey.NOTIFICATIONS_OPTIMIZATION
  )
  const response = await fetchWithAppCheck({
    url: Config.NOTIFICATION_SENDER_API_URL + '/v1/push/register',
    bodyJson: JSON.stringify({
      deviceToken: fcmToken,
      deviceArn: storedDeviceArn,
      appType: 'CORE_MOBILE_APP',
      osType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
    })
  }).catch(error => {
    Logger.error(
      `[registerDeviceToNotificationSender.ts][registerDevice]${error}`
    )
    throw error
  })
  if (response.ok) {
    const { deviceArn } = await response.json()
    commonStorage.set(StorageKey.NOTIFICATIONS_OPTIMIZATION, deviceArn)
    return deviceArn
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
