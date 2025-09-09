import { Alert, Linking, Platform } from 'react-native'
import { StorageKey } from 'resources/Constants'
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'
import DeviceInfo from 'react-native-device-info'

const inAppUpdates = new SpInAppUpdates(true)

const FAKE_CURRENT_VERSION_FOR_TESTING = '1.0.8'
const FAKE_CURRENT_BUILD_NUMBER_FOR_TESTING = '5000'
export class AppUpdateService {
  static async checkAppUpdateStatus(): Promise<AppUpdateStatus | undefined> {
    try {
      Alert.alert(
        `checkAppUpdateStatus: getVersion: ${DeviceInfo.getVersion()}`
      )
      const response = await inAppUpdates.checkNeedsUpdate({
        curVersion:
          Platform.OS === 'android'
            ? FAKE_CURRENT_BUILD_NUMBER_FOR_TESTING
            : FAKE_CURRENT_VERSION_FOR_TESTING,
        customVersionComparator:
          Platform.OS === 'android'
            ? (v1, v2) => {
                return v1 > v2 ? 1 : v1 < v2 ? -1 : 0
              }
            : undefined
      })

      Alert.alert('checkAppUpdateStatus response', JSON.stringify(response))

      return response
    } catch (e) {
      // if (typeof e === 'object' && e && 'message' in e) {
      //   Alert.alert('checkAppUpdateStatus failed', e.message as string)
      // }
      Logger.error('checkAppUpdateStatus failed', e)
      return undefined
    }
  }

  static async performUpdate(): Promise<void> {
    if (Platform.OS === 'android') {
      await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE })
    } else {
      const appId = '6443685999'
      const appStoreURI = `itms-apps://apps.apple.com/app/id${appId}`
      const appStoreURL = `https://apps.apple.com/app/id${appId}`

      const canOpenAppStoreURI = await Linking.canOpenURL(appStoreURI)
      if (canOpenAppStoreURI) {
        Linking.openURL(appStoreURI)
      } else {
        Linking.openURL(appStoreURL)
      }
    }
  }

  static hasSeenAppUpdateScreen(version: string): boolean {
    const lastSeenVersion = commonStorage.getString(
      StorageKey.LAST_SEEN_UPDATE_APP_VERSION
    )

    return lastSeenVersion === version
  }

  static markAppUpdateScreenAsSeen(version: string): void {
    if (!version) return

    commonStorage.set(StorageKey.LAST_SEEN_UPDATE_APP_VERSION, version)
  }
}

export type AppUpdateStatus = {
  shouldUpdate: boolean
  storeVersion: string
}
