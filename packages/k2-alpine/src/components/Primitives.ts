import {
  styled,
  Text as DripsyText,
  ScrollView as DripsyScrollView,
  View as DripsyView,
  FlatList as DripsyFlatList,
  SafeAreaView as DripsySafeAreaView
} from 'dripsy'
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
})({
  // default color
  color: '$textPrimary'
})

export const ScrollView = styled(
  DripsyScrollView,
  {}
)({
  backgroundColor: '$surfacePrimary'
})

export const View = styled(
  DripsyView,
  {}
)({
  backgroundColor: '$surfacePrimary'
})

export const FlatList = styled(
  DripsyFlatList,
  {}
)({
  backgroundColor: '$surfacePrimary'
})

export const SafeAreaView = styled(
  DripsySafeAreaView,
  {}
)({
  backgroundColor: '$surfacePrimary'
})

export { TextInput, Image, Pressable, ActivityIndicator } from 'dripsy'
