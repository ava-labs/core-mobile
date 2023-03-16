import React from 'react'
import { View, ViewStyle } from 'react-native'

type Props = {
  color?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any
  style?: ViewStyle
  testID?: string
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
