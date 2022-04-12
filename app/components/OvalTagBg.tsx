import React from 'react'
import {View, ViewStyle} from 'react-native'

type Props = {
  color: string
  children: any
  style?: ViewStyle
}

export default function OvalTagBg({
  color,
  children,
  style
}: Props): JSX.Element {
  return (
    <View
      style={[
        {
          backgroundColor: color,
          borderRadius: 100,
          paddingHorizontal: 12,
          paddingVertical: 8,
          justifyContent: 'center',
          alignItems: 'center'
        },
        style
      ]}>
      {children}
    </View>
  )
}
