import React, { forwardRef, PropsWithChildren, useMemo } from 'react'
import {
  Insets,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  View as RNView
} from 'react-native'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { TextVariant } from '../../theme/tokens/text'
import { GlassView } from '../../components/GlassView/GlassView'
import { alpha, overlayColor } from '../../utils/colors'
import { K2AlpineTheme } from '../../theme/theme'
import { useTheme } from '../../hooks'

export type ButtonType = 'primary' | 'secondary' | 'tertiary'
export type ButtonSize = 'small' | 'medium' | 'large'

type ButtonIconType = 'check' | 'expandMore' | 'google' | 'apple'

const BUTTON_ICON_TYPES = ['check', 'expandMore', 'google', 'apple'] as const

const isButtonIconType = (value: unknown): value is ButtonIconType => {
  return (BUTTON_ICON_TYPES as readonly string[]).includes(value as string)
}

interface ButtonProps {
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  type: ButtonType
  size: ButtonSize
  leftIcon?: ButtonIconType | JSX.Element
  rightIcon?: ButtonIconType | JSX.Element
  hitSlop?: number | Insets
}

export const Button = forwardRef<RNView, ButtonProps & PropsWithChildren>(
  (
    {
      type,
      size,
      leftIcon,
      rightIcon,
      disabled,
      style,
      children,
      testID,
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme()

    const tintColor = useMemo(
      () => getTintColor(type, theme, disabled),
      [disabled, type, theme]
    )

    const backgroundColor = useMemo(
      () => getBackgroundColor(type, theme, disabled),
      [type, theme, disabled]
    )

    const iconWidth = { large: 20, medium: 16, small: 16 }[size]
    const textVariant = {
      large: 'buttonMedium',
      medium: 'buttonMedium',
      small: 'buttonSmall'
    }[size] as TextVariant

    const shouldUseBlurWrapper = type === 'secondary' && !disabled
    const WrapperComponent = shouldUseBlurWrapper ? GlassView : View

    return (
      <TouchableOpacity
        ref={ref}
        accessible={false}
        testID={testID}
        disabled={disabled}
        style={[
          { borderRadius: 1000, overflow: 'hidden', alignItems: 'center' },
          style
        ]}
        {...rest}>
        <WrapperComponent
          style={{
            alignItems: 'center',
            marginHorizontal: 8,
            justifyContent: 'center',
            width: '100%',
            backgroundColor
          }}
          {...(shouldUseBlurWrapper && {
            glassType: theme.isDark ? 'dark3' : 'light2'
          })}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              ...sizeStyles[size]
            }}>
            {React.isValidElement(leftIcon)
              ? leftIcon
              : isButtonIconType(leftIcon)
              ? getIcon(leftIcon, {
                  width: iconWidth,
                  height: iconWidth,
                  color: tintColor,
                  style: { marginRight: 8 }
                })
              : null}
            <Text
              numberOfLines={1}
              variant={textVariant}
              style={{
                color: tintColor,
                flexShrink: 1
              }}>
              {children}
            </Text>
            {React.isValidElement(rightIcon)
              ? rightIcon
              : isButtonIconType(rightIcon)
              ? getIcon(rightIcon, {
                  width: iconWidth,
                  height: iconWidth,
                  color: tintColor,
                  style: { marginLeft: 8 }
                })
              : null}
          </View>
        </WrapperComponent>
      </TouchableOpacity>
    )
  }
)

const sizeStyles = StyleSheet.create({
  large: {
    paddingHorizontal: 12,
    minHeight: 42
  },
  medium: {
    paddingHorizontal: 12,
    minHeight: 36
  },
  small: {
    paddingHorizontal: 8,
    minHeight: 27
  }
})

const iconComponents = {
  check: Icons.Navigation.Check,
  expandMore: Icons.Navigation.ExpandMore,
  google: Icons.Logos.Google,
  apple: Icons.Logos.Apple
}

const getIcon = (
  type: ButtonIconType,
  iconProps: {
    width: number
    height: number
    color: string
    style?: ViewStyle
  }
): JSX.Element | undefined => {
  const IconComponent = iconComponents[type]
  return <IconComponent {...iconProps} />
}

const getBackgroundColor = (
  type: ButtonType,
  theme: K2AlpineTheme,
  disabled: boolean | undefined
): string | undefined => {
  if (disabled) {
    return theme.isDark
      ? overlayColor(
          alpha(lightModeColors.$surfacePrimary, 0.3),
          darkModeColors.$surfacePrimary
        )
      : overlayColor(
          alpha(darkModeColors.$surfacePrimary, 0.3),
          lightModeColors.$surfacePrimary
        )
  }

  switch (type) {
    case 'primary':
      return theme.isDark
        ? lightModeColors.$surfacePrimary
        : darkModeColors.$surfacePrimary
    case 'secondary':
      return undefined
    case 'tertiary':
      return theme.colors.$surfacePrimary
  }
}

export const getTintColor = (
  type: ButtonType,
  theme: K2AlpineTheme,
  disabled: boolean | undefined
): string => {
  if (disabled) {
    return theme.isDark
      ? lightModeColors.$textPrimary
      : darkModeColors.$textPrimary
  }
  switch (type) {
    case 'primary':
      return theme.isDark
        ? lightModeColors.$textPrimary
        : darkModeColors.$textPrimary
    case 'secondary':
    case 'tertiary':
      return theme.colors.$textPrimary
  }
}

Button.displayName = 'Button'
