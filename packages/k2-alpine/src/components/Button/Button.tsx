import React, { forwardRef, PropsWithChildren, useMemo } from 'react'
import {
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle
} from 'react-native'
import { useDripsyTheme as useTheme } from 'dripsy'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import {
  colors,
  darkModeColors,
  lightModeColors
} from '../../theme/tokens/colors'
import { TextVariant } from '../../theme/tokens/text'
import { GlassView } from '../../components/GlassView/GlassView'
import { alpha, overlayColor } from '../../utils/colors'
import { K2AlpineTheme } from '../../theme/theme'

export type ButtonType = 'primary' | 'secondary' | 'tertiary'
export type ButtonSize = 'small' | 'medium' | 'large'

type ButtonIconType = 'check' | 'expandMore'

interface ButtonProps {
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  type: ButtonType
  size: ButtonSize
  leftIcon?: ButtonIconType
  rightIcon?: ButtonIconType
}

export const Button = forwardRef<
  TouchableOpacity,
  ButtonProps & PropsWithChildren
>(
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
        {...rest}>
        <View
          style={[
            {
              borderRadius: 1000,
              alignItems: 'center',
              overflow: 'hidden'
            },
            style
          ]}>
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
              {leftIcon ? (
                getIcon(leftIcon, {
                  width: iconWidth,
                  height: iconWidth,
                  color: tintColor,
                  style: { marginRight: 8 }
                })
              ) : rightIcon ? (
                <View style={{ width: iconWidth, marginRight: 8 }} />
              ) : null}
              <Text
                numberOfLines={1}
                variant={textVariant}
                adjustsFontSizeToFit={Platform.OS === 'ios'}
                style={{
                  color: tintColor,
                  flexShrink: 1
                }}>
                {children}
              </Text>
              {rightIcon ? (
                getIcon(rightIcon, {
                  width: iconWidth,
                  height: iconWidth,
                  color: tintColor,
                  style: { marginLeft: 8 }
                })
              ) : leftIcon ? (
                <View style={{ width: iconWidth, marginLeft: 8 }} />
              ) : null}
            </View>
          </WrapperComponent>
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
  expandMore: Icons.Navigation.ExpandMore
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
      ? overlayColor(alpha(colors.$neutralWhite, 0.3), colors.$neutral850)
      : overlayColor(alpha(colors.$neutral850, 0.3), colors.$neutralWhite)
  }

  switch (type) {
    case 'primary':
      return theme.isDark ? colors.$neutralWhite : colors.$neutral850
    case 'secondary':
      return undefined
    case 'tertiary':
      return theme.colors.$surfacePrimary
  }
}

const getTintColor = (
  type: ButtonType,
  theme: K2AlpineTheme,
  disabled: boolean | undefined
): string => {
  if (disabled) {
    return theme.isDark ? colors.$neutral850 : colors.$neutralWhite
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