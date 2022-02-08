import React from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

const Separator = ({
  style,
  inset,
  color,
  vertical,
}: {
  style?: StyleProp<ViewStyle>;
  inset?: number;
  color?: string;
  vertical?: string;
}) => {
  const {theme} = useApplicationContext();
  return (
    <View
      style={[
        {
          height: !vertical ? 1 : undefined,
          width: vertical ? 1 : undefined,
          backgroundColor: color ?? theme.colorStroke,
          marginHorizontal: inset ?? 0,
        },
        style,
      ]}
    />
  );
};

export default Separator;
