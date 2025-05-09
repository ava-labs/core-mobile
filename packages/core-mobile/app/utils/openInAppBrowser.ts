import { Linking } from 'react-native'
import InAppBrowser, {
  InAppBrowserOptions
} from 'react-native-inappbrowser-reborn'
import Logger from './Logger'

// @deprecated use openUrl from useCoreBrowser hook instead
export const openInAppBrowser = async (
  url: string,
  options: InAppBrowserOptions
): Promise<void> => {
  try {
    if (await InAppBrowser.isAvailable()) {
      InAppBrowser.open(url, options)
    } else {
      failSafe(url)
    }
  } catch (e) {
    failSafe(url)
  }
}

function failSafe(url: string): void {
  Linking.openURL(url).catch(Logger.error)
}
