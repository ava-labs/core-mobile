import React from 'react';
import {View} from 'react-native';

type Props = {
  color: string;
  children: any;
};

export default function OvalTagBg({color, children}: Props) {
  return (
    <View
      style={{
        backgroundColor: color,
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}>
      {children}
    </View>
  );
}
