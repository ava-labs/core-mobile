import { enableFreeze } from 'react-native-screens'
import { AppRegistry, LogBox, Platform, UIManager } from 'react-native'

// Disable react-native-screens freezing on Android only. The combination of
// freezing and the <Stack.Protected guard> swap pattern in RootNavigator
// broke native view composition on Android release builds, leaving warm-
// background notification taps stuck on a blank screen. iOS keeps freezing
// for the memory/perf benefit; only Android needs the opt-out.
enableFreeze(Platform.OS !== 'android')
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

AppRegistry.registerComponent(expo.name, () => AppEntryPoint)

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}
