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
import ContextApp from './app/ContextApp'
import { name as appName } from './app.json'

import DevDebuggingConfig from './app/utils/debugging/DevDebuggingConfig'
import { server } from './tests/msw/server'

// if (!DevDebuggingConfig.STORYBOOK_ENABLED) {
AppRegistry.registerComponent(appName, () => ContextApp)
// } else {
//   import('./storybook');
// }

if (DevDebuggingConfig.API_MOCKING || process.env.API_MOCKING) {
  server.listen()
}
