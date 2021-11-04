import React from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

const Separator = ({style}: {style?: StyleProp<ViewStyle>}) => {
  const {theme} = useApplicationContext();
  return (
    <View style={[{height: 1, backgroundColor: theme.colorStroke}, style]} />
  );
};

export default Separator;
