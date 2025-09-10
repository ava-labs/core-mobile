import { Linking } from 'react-native'
import {
  APP_STORE_URI,
  APP_STORE_URL,
  BUNDLE_ID,
  PLAY_STORE_URI,
  PLAY_STORE_URL,
  StorageKey
} from 'resources/Constants'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'
import { checkVersion } from 'react-native-check-version'
import { checkForUpdate, UpdateFlow } from 'react-native-in-app-updates'

export class AppUpdateService {
  static async checkAppUpdateStatus(): Promise<AppUpdateStatus | undefined> {
    try {
      return await checkVersion({
        bundleId: BUNDLE_ID // set production bundle id, to enable testing in internal builds
      })
    } catch (e) {
      Logger.error('checkAppUpdateStatus failed', e)
      return undefined
    }
  }

  static async goToAppStore(): Promise<void> {
    const canOpenAppStoreURI = await Linking.canOpenURL(APP_STORE_URI)
    if (canOpenAppStoreURI) {
      Linking.openURL(APP_STORE_URI)
    } else {
      Linking.openURL(APP_STORE_URL)
    }
  }

  static async goToPlayStore(): Promise<void> {
    const canOpenPlayStoreURI = await Linking.canOpenURL(PLAY_STORE_URI)
    if (canOpenPlayStoreURI) {
      Linking.openURL(PLAY_STORE_URI)
    } else {
      Linking.openURL(PLAY_STORE_URL)
    }
  }

  static async performAndroidInAppUpdate(): Promise<void> {
    await checkForUpdate(UpdateFlow.FLEXIBLE)
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
  needsUpdate: boolean
  version: string
}
