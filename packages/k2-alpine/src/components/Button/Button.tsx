import React, { forwardRef, PropsWithChildren, useMemo } from 'react'
import {
  Insets,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  View as RNView,
  TextStyle
} from 'react-native'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { TextVariant } from '../../theme/tokens/text'
import {
  getButtonBackgroundColor,
  getButtonTintColor
} from '../../utils/colors'
import { useInversedTheme, useTheme } from '../../hooks'

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
  textStyle?: StyleProp<TextStyle>
  testID?: string
  type: ButtonType
  size: ButtonSize
  leftIcon?: ButtonIconType | JSX.Element
  rightIcon?: ButtonIconType | JSX.Element
  hitSlop?: number | Insets
  shouldInverseTheme?: boolean
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
      textStyle,
      children,
      testID,
      shouldInverseTheme = false,
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme()
    const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
    const resultTheme = useMemo(
      () => (shouldInverseTheme ? inversedTheme : theme),
      [inversedTheme, shouldInverseTheme, theme]
    )

    const tintColor = useMemo(
      () => getButtonTintColor(type, resultTheme, disabled),
      [disabled, type, resultTheme]
    )

    const backgroundColor = useMemo(
      () => getButtonBackgroundColor(type, resultTheme, disabled),
      [type, resultTheme, disabled]
    )

    const iconWidth = { large: 20, medium: 16, small: 16 }[size]
    const textVariant = {
      large: 'buttonMedium',
      medium: 'buttonMedium',
      small: 'buttonSmall'
    }[size] as TextVariant

    return (
      <TouchableOpacity
        ref={ref}
        accessible={false}
        testID={testID}
        disabled={disabled}
        style={[
          {
            borderRadius: 1000,
            overflow: 'hidden',
            alignItems: 'center'
          },
          style
        ]}
        {...rest}>
        <View
          style={{
            alignItems: 'center',
            marginHorizontal: 8,
            justifyContent: 'center',
            width: '100%',
            backgroundColor
          }}>
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
              style={[
                {
                  color: tintColor,
                  flexShrink: 1
                },
                textStyle
              ]}>
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
        </View>
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
    color: string | undefined
    style?: ViewStyle
  }
): JSX.Element | undefined => {
  const IconComponent = iconComponents[type]
  return <IconComponent {...iconProps} />
}

Button.displayName = 'Button'
