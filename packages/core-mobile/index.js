/**
 * @format
 */
import { AppRegistry, Text, TextInput } from 'react-native'
import './polyfills'
import Big from 'big.js'
import FCMService from 'services/fcm/FCMService'
import AppCheckService from 'services/fcm/AppCheckService'
import Bootsplash from 'react-native-bootsplash'
import ContextApp from './app/ContextApp'
import { name as appName } from './app.json'
import DevDebuggingConfig from './app/utils/debugging/DevDebuggingConfig'
import { server } from './tests/msw/native/server'

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

let AppEntryPoint = ContextApp

if (DevDebuggingConfig.STORYBOOK_ENABLED) {
  Bootsplash.hide()
  AppEntryPoint = require('./storybook').default
}

AppCheckService.init()
FCMService.listenForMessagesBackground()
// NotificationsService.onBackgroundEvent(handleNotificationCallback)

AppRegistry.registerComponent(appName, () => AppEntryPoint)

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}
