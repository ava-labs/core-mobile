import React from 'react'
import { styled, Text as DripsyText, View as DripsyView } from 'dripsy'
import {
  TouchableHighlight as RNTouchableHighlight,
  TouchableOpacity as RNTouchableOpacity
} from 'react-native'

export const TouchableHighlight = styled(RNTouchableHighlight)()

export const TouchableOpacity = styled(RNTouchableOpacity)()

export const Text = styled(DripsyText, {
  themeKey: 'text',
  // default variant
  defaultVariant: 'body1'
})((props: React.ComponentProps<typeof DripsyText>) => ({
  // default color
  color: props.variant === 'overline' ? '$neutral400' : '$neutral50'
}))

export const View = styled(
  DripsyView,
  {}
)(() => ({
  // default background color
  backgroundColor: '$black'
}))

export {
  TextInput,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator
} from 'dripsy'
