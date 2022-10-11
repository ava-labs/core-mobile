/**
 * @format
 */
import 'react-native-gesture-handler'
import './shim'
import './read_as_array_buffer_shim'
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'
import 'es6-promise/auto'
import { AppRegistry } from 'react-native'
import ContextApp from './app/ContextApp'
import { name as appName } from './app.json'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DevDebuggingConfig from './app/utils/debugging/DevDebuggingConfig'

// if (!DevDebuggingConfig.STORYBOOK_ENABLED) {
AppRegistry.registerComponent(appName, () => ContextApp)
// } else {
//   import('./storybook');
// }
