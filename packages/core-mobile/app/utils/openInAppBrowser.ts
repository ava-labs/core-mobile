import { Linking } from 'react-native'
import InAppBrowser, {
  InAppBrowserOptions
} from 'react-native-inappbrowser-reborn'
import { useDisableLockAppStore } from 'features/accountSettings/store'
import Logger from './Logger'

// @deprecated use openUrl from useCoreBrowser hook instead
export const openInAppBrowser = async (
  url: string,
  options: InAppBrowserOptions
): Promise<void> => {
  try {
    if (await InAppBrowser.isAvailable()) {
      useDisableLockAppStore.setState({ disableLockApp: true })
      const result = await InAppBrowser.open(url, options)
      if (result.type === 'cancel' || result.type === 'dismiss') {
        useDisableLockAppStore.setState({ disableLockApp: false })
      }
    } else {
      failSafe(url)
    }
  } catch (e) {
    failSafe(url)
  }
}

export const closeInAppBrowser = async (): Promise<void> => {
  useDisableLockAppStore.setState({ disableLockApp: false })
  InAppBrowser.close()
}

function failSafe(url: string): void {
  Linking.openURL(url).catch(Logger.error)
}
