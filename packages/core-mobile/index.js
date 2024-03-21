/**
 * @format
 */
import { Text, TextInput } from 'react-native'
import './polyfills'
import { AppRegistry } from 'react-native'
import Big from 'big.js'
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

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen({
    onUnhandledRequest: 'bypass'
  })
}

if (process.env.PERF_ENABLED) {
  require('react-native-performance-flipper-reporter').setupDefaultFlipperReporter()
}
