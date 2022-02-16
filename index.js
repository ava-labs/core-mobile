/**
 * @format
 */

import {AppRegistry} from 'react-native';
import ContextApp from './app/ContextApp';
import {name as appName} from './app.json';
import "./shims"

AppRegistry.registerComponent(appName, () => ContextApp);
