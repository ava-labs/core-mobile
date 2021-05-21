/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

require('node-libs-react-native/globals');

AppRegistry.registerComponent(appName, () => App);
