/**
 * @format
 */

import {AppRegistry} from 'react-native'
import ContextApp from './app/ContextApp'
import {name as appName} from './app.json'
import './shims'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DevDebuggingConfig from './app/utils/debugging/DevDebuggingConfig'

// if (!DevDebuggingConfig.STORYBOOK_ENABLED) {
AppRegistry.registerComponent(appName, () => ContextApp)
// } else {
//   import('./storybook');
// }
