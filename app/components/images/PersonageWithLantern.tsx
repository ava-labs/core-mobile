import React from 'react';
import {Image} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

function PersonageWithLantern() {
  const {isDarkMode} = useApplicationContext();
  const graphics = isDarkMode
    ? require('../../assets/tbd_graphics_dark.png')
    : require('../../assets/tbd_graphics_light.png');

  return <Image source={graphics} />;
}

export default PersonageWithLantern;
