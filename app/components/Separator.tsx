import React from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

const Separator = ({
  style,
  inset,
  color,
}: {
  style?: StyleProp<ViewStyle>;
  inset?: number;
  color?: string;
}) => {
  const {theme} = useApplicationContext();
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: color ?? theme.colorStroke,
          marginHorizontal: inset ?? 0,
        },
        style,
      ]}
    />
  );
};

export default Separator;
