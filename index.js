/**
 * @format
 */
import 'react-native-gesture-handler'
import './shim'
import './polyfills'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import '@walletconnect/react-native-compat'
import { AppRegistry } from 'react-native'
import * as secp from '@noble/secp256k1'
import Crypto from 'react-native-quick-crypto'
import ContextApp from './app/ContextApp'
import { name as appName } from './app.json'
import DevDebuggingConfig from './app/utils/debugging/DevDebuggingConfig'
import { server } from './tests/msw/native/server'

// @noble/secp256k1 uses the webcrypto API by default
// Overwrite the way it calculates the cache
secp.utils.hmacSha256 = async (k, ...m) => {
  return Crypto.Hmac('sha256', k, secp.utils.concatBytes(...m)).digest()
}

// if (!DevDebuggingConfig.STORYBOOK_ENABLED) {
AppRegistry.registerComponent(appName, () => ContextApp)
// } else {
//   import('./storybook');
// }
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
