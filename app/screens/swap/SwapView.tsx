import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';

export default function SwapView(): JSX.Element {
  const {isDarkMode} = useApplicationContext();
  const graphics = isDarkMode
    ? require('../assets/tbd_graphics_dark.png')
    : require('../assets/tbd_graphics_light.png');
  return (
    <View style={[styles.container]}>
      <Image source={graphics} />
      <AvaText.Heading3>Swap is coming soon!</AvaText.Heading3>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});
