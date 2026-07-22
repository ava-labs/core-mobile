import { enableFreeze } from 'react-native-screens'

enableFreeze(true)

import { AppRegistry, LogBox, Platform, UIManager } from 'react-native'
import { fetch as whatwgFetch } from 'whatwg-fetch'
import './polyfills'
import Big from 'big.js'
import FCMService from 'services/fcm/FCMService'
import AppCheckService from 'services/fcm/AppCheckService'
import NotificationsService from 'services/notifications/NotificationsService'
import Bootsplash from 'react-native-bootsplash'
import Logger, { LogLevel } from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import SentryService from 'services/sentry/SentryService'
import NewApp from 'new/ContextApp'
import { initI18n } from 'i18n'
import { expo } from './app.json'
import { server } from './tests/msw/native/server'
import { setupDeBankCaching } from './app/utils/setupDeBankCaching'

if (__DEV__) {
  require('./ReactotronConfig')

  if (DevDebuggingConfig.LOGBOX_DISABLED) {
    LogBox.ignoreAllLogs(true)

    const ignoreWarns = ['Reanimated']

    // eslint-disable-next-line no-console
    const warn = console.warn
    // eslint-disable-next-line no-console
    console.warn = (...arg) => {
      const first = arg[0]
      if (typeof first === 'string') {
        for (const warning of ignoreWarns) {
          if (first.includes(warning)) {
            return
          }
        }
      }
      warn(...arg)
    }
  }

  // eslint-disable-next-line no-console
  console.reportErrorsAsExceptions = false
}

// Expo SDK 56's winter runtime replaces globalThis.fetch with expo/fetch,
// whose Android response-body handling can corrupt payloads (surfaces as
// "JSON Parse error: Unexpected character" in avalanchejs P-Chain RPC calls
// during staking — see expo/expo#46398, not yet backported to SDK 56).
// Restore React Native's whatwg-fetch for global consumers until the upstream
// fix ships. Explicit `expo/fetch` imports (streaming) are unaffected. This
// must run after the import graph above (where the winter runtime installs
// its fetch) and before setupDeBankCaching() below (which wraps global.fetch).
global.fetch = whatwgFetch

// TODO: remove this once we integrate with the new balance service
setupDeBankCaching()

SentryService.init()

Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true)

Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

// set Big properties globally to not use exponential notation
Big.PE = 99
Big.NE = -18

let AppEntryPoint = NewApp

if (DevDebuggingConfig.STORYBOOK_ENABLED) {
  Bootsplash.hide()
  //AppEntryPoint = require('./storybook').default
}

AppCheckService.init()
FCMService.listenForMessagesBackground()
// Notifee only supports a single background event handler and requires it to
// be registered before AppRegistry.registerComponent so it can handle cold-start
// PRESS events for notifications displayed by notifee (data-only Android push).
NotificationsService.registerBackgroundNotificationHandler()

// If init rejects, registerComponent below still mounts the tree against an
// uninitialized i18n. Capture via SentryService directly (not just Logger):
// SentryService.init() has already run above, whereas Logger only forwards to
// Sentry after shouldLogErrorToSentry is armed later — so a cold-start i18n
// failure would otherwise reach Sentry nowhere in release.
initI18n().catch(err => {
  const message = '[i18n] init failed'
  Logger.error(message, err)
  SentryService.captureException(message, {
    value: err,
    tags: { errorId: 'i18n_init_failed' }
  })
})
AppRegistry.registerComponent(expo.name, () => AppEntryPoint)

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}
