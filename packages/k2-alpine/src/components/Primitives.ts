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
import React from 'react'
import { useDripsyTheme } from 'dripsy'
import type { TextVariant } from '../theme/tokens/text'
import { resolveTextLineHeight } from '../utils/tallScriptLineHeight'

export const TouchableHighlight = styled(RNTouchableHighlight)()

export const TouchableOpacity = styled(RNTouchableOpacity)()

const StyledText = styled(DripsyText, {
  themeKey: 'text',
  // default variant
  defaultVariant: 'body1'
})({
  // default color
  color: '$textPrimary'
})
export const Text = React.forwardRef<
  React.ComponentRef<typeof StyledText>,
  React.ComponentProps<typeof StyledText>
>((props, ref) => {
  const { theme } = useDripsyTheme()
  const variant = (props.variant ?? 'body1') as TextVariant
  // Relax lineHeight for CJK/Devanagari content using a per-script ratio —
  // several text variants set lineHeight at/near fontSize, which clips tall
  // (non-Latin) glyphs on iOS. A caller-set lineHeight (sx or style) always wins.
  const scriptLineHeight = resolveTextLineHeight({
    spec: theme.text[variant],
    children: props.children,
    callerLineHeight:
      (props.sx as { lineHeight?: number } | undefined)?.lineHeight ??
      (props.style as { lineHeight?: number } | undefined)?.lineHeight
  })
  return React.createElement(StyledText, {
    ...props,
    // spread props.sx last so a caller override always wins
    sx:
      scriptLineHeight !== undefined
        ? { lineHeight: scriptLineHeight, ...props.sx }
        : props.sx,
    allowFontScaling: false,
    ref
  })
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
