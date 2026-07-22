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
import { resolveTallScriptLineHeight } from '../utils/tallScriptLineHeight'

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
  const spec = theme.text[variant]
  // Relax lineHeight for CJK/Devanagari content using a per-script ratio —
  // several text variants set lineHeight at/near fontSize, which clips tall
  // (non-Latin) glyphs on iOS.
  const scriptLineHeight = spec
    ? resolveTallScriptLineHeight(spec, props.children)
    : undefined
  return React.createElement(StyledText, {
    ...props,
    // Inject via the `style` prop (prepended), not by spreading into `sx`.
    // Dripsy composes styles as [variant, ...style, sx] (last wins), so this
    // overrides the variant's lineHeight yet is still overridden by any
    // caller-provided `style` or `sx` — including function- or array-form values,
    // which an object-spread of `sx` would silently drop. Nested/array `style` is
    // flattened by RN, so no manual StyleSheet.flatten or caller-lineHeight
    // detection is needed.
    style:
      scriptLineHeight !== undefined
        ? [{ lineHeight: scriptLineHeight }, props.style]
        : props.style,
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
