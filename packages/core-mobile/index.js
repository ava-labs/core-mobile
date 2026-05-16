import { enableFreeze } from 'react-native-screens'

enableFreeze(true)

import { AppRegistry, LogBox, Platform, UIManager } from 'react-native'
import './polyfills'
import Big from 'big.js'
import FCMService from 'services/fcm/FCMService'
import AppCheckService from 'services/fcm/AppCheckService'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// BLANK-DEBUG: temporarily disable the notifee background handler
// registration to test whether the registration itself (or the headless
// task it spawns on PRESS) is what's leaving Android release builds with
// a blank screen on warm-background notification taps. If blank disappears
// with this commented out, the production fix needs to change WHEN/WHERE
// we register this handler.
//
// Cost while diagnostic is on:
//  - cold-start presses on data-only Android pushes won't be captured
//    (the original CP-14006 regression returns for that path only)
//  - notifee trigger notifications won't be auto-cancelled on press
//
// // Notifee only supports a single background event handler and requires it to
// // be registered before AppRegistry.registerComponent so it can handle cold-start
// // PRESS events for notifications displayed by notifee (data-only Android push).
// NotificationsService.registerBackgroundNotificationHandler()

AppRegistry.registerComponent(expo.name, () => AppEntryPoint)

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}
