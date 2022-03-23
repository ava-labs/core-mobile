import React from 'react';
import OwlLogoSVG from 'components/svg/OwlLogoSVG';
import {Space} from 'components/Space';
import CoreSVG from 'components/svg/CoreSVG';
import {StyleProp, View, ViewStyle} from 'react-native';

export type OwlBrandLogoProps = {
  logoHeight?: number;
  textHeight?: number;
  style?: StyleProp<ViewStyle>;
  orientation?: 'horizontal' | 'vertical';
};
export default function OwlBrandLogo({
  logoHeight,
  textHeight,
  style,
  orientation = 'vertical',
}: OwlBrandLogoProps) {
  return (
    <View
      style={[
        {
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}>
      <OwlLogoSVG height={logoHeight} />
      <Space y={16} x={8} />
      <CoreSVG height={textHeight} />
    </View>
  );
}
