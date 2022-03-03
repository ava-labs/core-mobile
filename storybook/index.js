// if you use expo remove this line
import {AppRegistry} from 'react-native';
import {getStorybookUI, configure, addDecorator} from '@storybook/react-native';
import {withKnobs} from '@storybook/addon-knobs';
import {loadStories} from './storyLoader';

import './rn-addons';
import {ApplicationContextProvider} from '../app/contexts/ApplicationContext';
import {Component} from 'react';
import useDevDebugging from '../app/utils/debugging/DevDebugging';
import {FC} from 'react';

// enables knobs for all stories
addDecorator(withKnobs);

// import stories
configure(() => {
  loadStories();
}, module);

addDecorator(getStory => (
  <ApplicationContextProvider>{getStory()}</ApplicationContextProvider>
));

// Refer to https://github.com/storybookjs/react-native/tree/master/app/react-native#getstorybookui-options
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({
  port: 7007,
  onDeviceUI: true,
  resetStorybook: true,
  // asyncStorage: require('@react-native-async-storage/async-storage').default,
  // asyncStorage: require('@react-native-community/async-storage').default,
});

// If you are using React Native vanilla and after installation you don't see your app name here, write it manually.
// If you use Expo you should remove this line.
const ReactStorybookRoot = () => {
  useDevDebugging().configure();

  return <StorybookUIRoot />;
};
AppRegistry.registerComponent('AvaxWallet', () => ReactStorybookRoot);

//
// export default ReactStorybookRoot;
