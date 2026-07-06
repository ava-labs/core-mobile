import Logger from 'utils/Logger'
import Config from 'react-native-config'
import { appCheckPostJson } from 'utils/api/common/appCheckFetch'
import { Platform } from 'react-native'
import { commonStorage, CommonStorageKeys } from 'utils/mmkv'
import FCMService from 'services/fcm/FCMService'

// Singleton promise to prevent multiple concurrent calls
let pendingRegistration: Promise<string> | null = null

/**
 * Wrapper that deduplicates concurrent calls to registerDeviceToNotificationSender.
 * If a registration is already in progress, returns the same promise.
 */
export async function registerAndGetDeviceArn(): Promise<string> {
  if (pendingRegistration) {
    return pendingRegistration
  }

  pendingRegistration = registerDeviceToNotificationSender().finally(() => {
    pendingRegistration = null
  })

  return pendingRegistration
}

export async function registerDeviceToNotificationSender(): Promise<string> {
  const fcmToken = await FCMService.getFCMToken()
  const storedDeviceArn = commonStorage.getString(
    CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION
  )
  const response = await appCheckPostJson(
    Config.NOTIFICATION_SENDER_API_URL + '/v1/push/register',
    JSON.stringify({
      deviceToken: fcmToken,
      deviceArn: storedDeviceArn,
      appType: 'CORE_MOBILE_APP',
      osType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
    })
  ).catch(error => {
    Logger.error(
      `[registerDeviceToNotificationSender.ts][registerDevice]${error}`
    )
    throw error
  })
  if (response.ok) {
    const { deviceArn } = await response.json()
    commonStorage.set(CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION, deviceArn)
    return deviceArn
  } else {
    throw new Error(`${response.status}:${response.statusText}`)
  }
}
