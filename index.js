/**
 * @format
 */

import {AppRegistry} from 'react-native';
import ContextApp from './app/ContextApp';
import {name as appName} from './app.json';

require('node-libs-react-native/globals');
require('react-native-crypto');
require('promise.allsettled').shim();


AppRegistry.registerComponent(appName, () => ContextApp);
