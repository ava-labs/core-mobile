import {
  styled,
  Text as DripsyText,
  ScrollView as DripsyScrollView,
  FlatList as DripsyFlatList
} from 'dripsy'
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context'
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
  backgroundColor: '$surfacePrimary',
  overflow: 'visible'
})

export const FlatList = styled(
  DripsyFlatList,
  {}
)({
  backgroundColor: '$surfacePrimary'
})

export const SafeAreaView = styled(
  SafeAreaContextView,
  {}
)({
  backgroundColor: '$surfacePrimary'
})

export {
  View,
  TextInput as RNTextInput,
  Image,
  Pressable,
  ActivityIndicator
} from 'dripsy'
