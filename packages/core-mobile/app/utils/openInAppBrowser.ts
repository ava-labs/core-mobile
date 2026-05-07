import { Linking } from 'react-native'
import InAppBrowser, {
  BrowserResult,
  InAppBrowserOptions,
  RedirectResult
} from 'react-native-inappbrowser-reborn'
import { ACTIONS } from 'contexts/DeeplinkContext/types'
import { useDisableLockAppStore } from 'features/accountSettings/store'
import Logger from './Logger'

const ALLOWED_REDIRECT_PREFIXES = [
  `core://${ACTIONS.OnrampCompleted}`,
  `core://${ACTIONS.OfframpCompleted}`
]

// @deprecated use openUrl from useCoreBrowser hook instead
export const openInAppBrowser = async (
  url: string,
  options: InAppBrowserOptions
): Promise<void> => {
  try {
    if (await InAppBrowser.isAvailable()) {
      useDisableLockAppStore.setState({ disableLockApp: true })
      const result = (await InAppBrowser.open(url, options)) as
        | BrowserResult
        | RedirectResult
      useDisableLockAppStore.setState({ disableLockApp: false })
      if (result.type === 'success' && result.url) {
        if (
          ALLOWED_REDIRECT_PREFIXES.some(prefix =>
            result.url.startsWith(prefix)
          )
        ) {
          Linking.openURL(result.url).catch(Logger.error)
        } else {
          Logger.error(
            `Blocked disallowed redirect from InAppBrowser: ${result.url}`
          )
        }
      }
    } else {
      useDisableLockAppStore.setState({ disableLockApp: false })
      failSafe(url)
    }
  } catch (e) {
    useDisableLockAppStore.setState({ disableLockApp: false })
    failSafe(url)
  }
}

export const closeInAppBrowser = async (): Promise<void> => {
  useDisableLockAppStore.setState({ disableLockApp: false })
  InAppBrowser.close()
}

export const openInAppBrowserForAuth = async (
  url: string,
  redirectUrl: string,
  options: InAppBrowserOptions
): Promise<string | undefined> => {
  try {
    if (await InAppBrowser.isAvailable()) {
      useDisableLockAppStore.setState({ disableLockApp: true })
      const result = await InAppBrowser.openAuth(url, redirectUrl, options)
      useDisableLockAppStore.setState({ disableLockApp: false })
      if (result.type === 'success') {
        return result.url
      }
    } else {
      useDisableLockAppStore.setState({ disableLockApp: false })
      failSafe(url)
    }
  } catch (e) {
    useDisableLockAppStore.setState({ disableLockApp: false })
    failSafe(url)
  }
  return undefined
}

function failSafe(url: string): void {
  Linking.openURL(url).catch(Logger.error)
}
