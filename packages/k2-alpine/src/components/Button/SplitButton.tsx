import React from 'react'
import { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { View } from '../Primitives'
import { Button, ButtonSize, ButtonType } from './Button'

type ButtonLeftRightIcon = React.ComponentProps<typeof Button>['leftIcon']

export type SplitButtonSide = {
  /** Button content. A string is rendered through `<Button>`'s default
   *  text styling; pass JSX (e.g. an `<ActivityIndicator />`) to render
   *  custom content (the in-flight spinner pattern). */
  children: React.ReactNode
  onPress: () => void
  disabled?: boolean
  /** Extra style merged onto the button. Combined with the side's
   *  asymmetric border radii — caller styles win for any property they
   *  set (including the radii, if a non-default shape is needed). */
  style?: StyleProp<ViewStyle>
  /** Override the button text color etc. (only applies to string children). */
  textStyle?: StyleProp<TextStyle>
  /** Optional icon (or icon-name) shown before `children`; mirrors
   *  `<Button>.leftIcon`. */
  leftIcon?: ButtonLeftRightIcon
  /** Optional icon (or icon-name) shown after `children`; mirrors
   *  `<Button>.rightIcon`. */
  rightIcon?: ButtonLeftRightIcon
  testID?: string
}

export type SplitButtonProps = {
  left: SplitButtonSide
  right: SplitButtonSide
  /** Shared `type` for both sides. Defaults to `secondary` to match the
   *  Figma design (light grey background). */
  type?: ButtonType
  /** Shared `size` for both sides. Defaults to `small` (h ≈ 27px) to
   *  match the Figma split-button height. */
  size?: ButtonSize
  /** Pixel gap between the two buttons. Defaults to 3 (Figma). */
  gap?: number
  /** Radius applied to each button's outer corners. Defaults to 20. */
  outerRadius?: number
  /** Radius applied to each button's inner corners (where the two
   *  buttons meet). Defaults to 4. Setting equal to `outerRadius` gives
   *  a plain two-pill row with no split visual. */
  innerRadius?: number
  /** Caps the row's overall width and centers it within its parent.
   *  Defaults to 240 so the pair stays a compact pill instead of
   *  stretching across the full screen. Pass `undefined` to let the row
   *  fill its parent. */
  maxWidth?: number
}

// Two side-by-side action buttons with mirrored asymmetric border radii —
// large radius on each button's outer corners and a tight radius on the
// inner corners where the pair meets. The asymmetry visually groups the
// two buttons as one control (Figma Core-Mobile-Redesign-2025 node
// 19239:29604).
//
// Each side has its own `onPress`, `disabled`, `style`, and `textStyle`
// (the right button often renders danger text — pass
// `textStyle={{ color: theme.colors.$textDanger }}`). The buttons share
// `type` / `size` so the visual weight stays paired.
export function SplitButton({
  left,
  right,
  type = 'secondary',
  size = 'small',
  gap = 3,
  outerRadius = 20,
  innerRadius = 4,
  maxWidth = 240
}: SplitButtonProps): JSX.Element {
  const leftRadii: ViewStyle = {
    borderTopLeftRadius: outerRadius,
    borderBottomLeftRadius: outerRadius,
    borderTopRightRadius: innerRadius,
    borderBottomRightRadius: innerRadius
  }
  const rightRadii: ViewStyle = {
    borderTopLeftRadius: innerRadius,
    borderBottomLeftRadius: innerRadius,
    borderTopRightRadius: outerRadius,
    borderBottomRightRadius: outerRadius
  }
  return (
    <View
      sx={{
        flexDirection: 'row',
        gap,
        width: '100%',
        maxWidth,
        alignSelf: 'center'
      }}>
      <Button
        type={type}
        size={size}
        disabled={left.disabled}
        testID={left.testID}
        textStyle={left.textStyle}
        leftIcon={left.leftIcon}
        rightIcon={left.rightIcon}
        style={[{ flex: 1 }, leftRadii, left.style]}
        onPress={left.onPress}>
        {left.children}
      </Button>
      <Button
        type={type}
        size={size}
        disabled={right.disabled}
        testID={right.testID}
        textStyle={right.textStyle}
        leftIcon={right.leftIcon}
        rightIcon={right.rightIcon}
        style={[{ flex: 1 }, rightRadii, right.style]}
        onPress={right.onPress}>
        {right.children}
      </Button>
    </View>
  )
}
