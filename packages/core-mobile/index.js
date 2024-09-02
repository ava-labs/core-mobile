/**
 * @format
 */
import { Text, TextInput } from 'react-native'
import './polyfills'
import { AppRegistry } from 'react-native'
import Big from 'big.js'
import FCMService from 'services/fcm/FCMService'
import { firebase } from '@react-native-firebase/app-check'
import Logger from 'utils/Logger'
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
  AppEntryPoint = require('./storybook').default
}

AppRegistry.registerComponent(appName, () => AppEntryPoint)
FCMService.listenForMessagesBackground()

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}

const rnfbProvider = firebase
  .appCheck()
  .newReactNativeFirebaseAppCheckProvider()
rnfbProvider.configure({
  android: {
    provider: __DEV__ ? 'debug' : 'playIntegrity',
    debugToken:
      'some token you have configured for your project firebase web console'
  },
  apple: {
    provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
    debugToken: process.env.APPCHECK_DEBUG_TOKEN_APPLE
  }
})

firebase
  .appCheck()
  .initializeAppCheck({
    provider: rnfbProvider,
    isTokenAutoRefreshEnabled: true
  })
  .catch(reason => {
    Logger.error(`initializeAppCheck failed: ${reason}`)
  })
