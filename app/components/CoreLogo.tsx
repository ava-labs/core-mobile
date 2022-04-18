import React from 'react'
import CoreSVG from 'components/svg/CoreSVG'
import { StyleProp, View, ViewStyle } from 'react-native'

type OwlBrandLogoProps = {
  logoHeight?: number
  textHeight?: number
  style?: StyleProp<ViewStyle>
  orientation?: 'horizontal' | 'vertical'
}
export default function CoreLogo({
  textHeight,
  style,
  orientation = 'vertical'
}: OwlBrandLogoProps) {
  return (
    <View
      style={[
        {
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center'
        },
        style
      ]}>
      <CoreSVG height={textHeight} />
    </View>
  )
}
