/**
 * @format
 */
import 'react-native-gesture-handler'
import './polyfills'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import '@walletconnect/react-native-compat'
import { AppRegistry } from 'react-native'
import Big from 'big.js'
import ContextApp from './app/ContextApp'
import { name as appName } from './app.json'
import DevDebuggingConfig from './app/utils/debugging/DevDebuggingConfig'
import { server } from './tests/msw/native/server'

//set Big properties globally to not use exponential notation
Big.PE = 99
Big.NE = -18

let AppEntryPoint = ContextApp

if (DevDebuggingConfig.STORYBOOK_ENABLED) {
  AppEntryPoint = require('./storybook').default
}

AppRegistry.registerComponent(appName, () => AppEntryPoint)

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen()
}

if (process.env.PERF_ENABLED) {
  require('react-native-performance-flipper-reporter').setupDefaultFlipperReporter()
}
