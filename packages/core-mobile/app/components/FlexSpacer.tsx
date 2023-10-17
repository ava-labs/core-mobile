import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

export default function FlexSpacer(style?: StyleProp<ViewStyle>): JSX.Element {
  return <View style={[style, { flex: 1 }]} />
}
