import React from 'react';
import {Dimensions, Image} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

const WINDOW_WIDTH = Dimensions.get('window').width;

function MountainTopFlag() {
  const {isDarkMode} = useApplicationContext();
  const graphics = isDarkMode
    ? require('../../assets/mountain_top_dark.png')
    : require('../../assets/mountain_top_light.png');

  return <Image source={graphics} style={{flex: 1, width: WINDOW_WIDTH}} />;
}

export default MountainTopFlag;
