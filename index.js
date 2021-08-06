/**
 * @format
 */

require('node-libs-react-native/globals');
require('react-native-crypto');

import {AppRegistry} from 'react-native';
import App from './app/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
