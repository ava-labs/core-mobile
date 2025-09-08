import { Linking, Platform } from 'react-native'
import { StorageKey } from 'resources/Constants'
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'

const inAppUpdates = new SpInAppUpdates(false)

export class AppUpdateService {
  static async checkAppUpdateStatus(): Promise<AppUpdateStatus | undefined> {
    try {
      return await inAppUpdates.checkNeedsUpdate()
    } catch (e) {
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
