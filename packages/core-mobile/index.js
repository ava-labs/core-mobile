import {
  AppRegistry,
  Text,
  TextInput,
  Platform,
  UIManager,
  LogBox
} from 'react-native'
import './polyfills'
import Big from 'big.js'
import FCMService from 'services/fcm/FCMService'
import AppCheckService from 'services/fcm/AppCheckService'
import Bootsplash from 'react-native-bootsplash'
import Logger, { LogLevel } from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import SentryService from 'services/sentry/SentryService'
import { AppSwitcher } from './AppSwitcher'
import { name as appName } from './app.json'
import { server } from './tests/msw/native/server'

if (__DEV__) {
  require('./ReactotronConfig')

  LogBox.ignoreLogs([
    'Require cycle:',
    "Can't perform",
    'new',
    'Non-serializable'
  ])

  DevDebuggingConfig.LOGBOX_DISABLED && LogBox.ignoreAllLogs(true)

  // eslint-disable-next-line no-console
  console.reportErrorsAsExceptions = false
}

SentryService.init()

Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(false)

Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

// set Big properties globally to not use exponential notation
Big.PE = 99
Big.NE = -18

/**
 * disable font scaling to prevent broken UI
 *
 * notes:
 * - we only disable it for the Text and TextInput components
 * - for native components (Alert, Dialog, DatePicker,...), it's okay
 *   to let them scale their text since they have been well tested
 */
Text.defaultProps = Text.defaultProps || {}
Text.defaultProps.allowFontScaling = false

TextInput.defaultProps = TextInput.defaultProps || {}
TextInput.defaultProps.allowFontScaling = false

let AppEntryPoint = AppSwitcher

if (DevDebuggingConfig.STORYBOOK_ENABLED) {
  Bootsplash.hide()
  AppEntryPoint = require('./storybook').default
}

AppCheckService.init()
FCMService.listenForMessagesBackground()

AppRegistry.registerComponent(appName, () => AppEntryPoint)

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}
