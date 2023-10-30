import React from 'react'
import { styled, Text as DripsyText } from 'dripsy'
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

export {
  View,
  TextInput,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator
} from 'dripsy'
