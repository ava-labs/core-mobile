import React, {FC} from 'react';
import {View, ViewProps} from 'react-native';

export const Row: FC<ViewProps> = ({style, children}) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'baseline',
        },
        style,
      ]}>
      {children}
    </View>
  );
};
