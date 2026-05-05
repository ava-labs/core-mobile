import React, { forwardRef, PropsWithChildren } from 'react'
import {
  Insets,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle
} from 'react-native'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'
import { Icons } from '../../theme/tokens/Icons'
import { alpha } from '../../utils'
import { Text } from '../Primitives'

type ChipSize = 'small' | 'large'
type ChipVariant = 'light' | 'dark'
type ChipIconType = 'expandMore'

interface ChipProps {
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  size: ChipSize
  variant?: ChipVariant
  rightIcon?: ChipIconType | JSX.Element
  hitSlop?: number | Insets
  accessibilityLabel?: string
  renderLeft?: () => JSX.Element
  isSelected?: boolean
}

export const Chip = forwardRef<
  React.ComponentRef<typeof TouchableOpacity>,
  ChipProps & PropsWithChildren
>(
  (
    {
      size,
      variant = 'light',
      rightIcon,
      style,
      children,
      accessibilityLabel,
      renderLeft,
      isSelected,
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme()

    const tintColor = {
      light: theme.colors.$textPrimary,
      dark: theme.isDark
        ? theme.colors.$textPrimary
        : theme.colors.$surfacePrimary
    }[variant]
    // Hello UI renders chips as outline pills (transparent + Vellum border),
    // so in Moto we drop the gray fill and use $borderPrimary for the
    // stroke. Default theme keeps the legacy filled-gray look.
    const isMotoOutline = theme.variant === 'moto' && variant === 'light'
    const backgroundColor = isMotoOutline
      ? 'transparent'
      : {
          light: theme.colors.$surfaceSecondary,
          dark: alpha(colors.$neutral700, 0.8)
        }[variant]
    const borderColor = isMotoOutline ? theme.colors.$borderPrimary : undefined
    const iconWidth = { large: 20, small: 16 }[size]

    return (
      <TouchableOpacity
        ref={ref}
        accessible={false}
        style={[
          {
            ...sizeStyles[size],
            borderRadius: 1000,
            backgroundColor: isSelected
              ? theme.colors.$textPrimary
              : backgroundColor,
            borderWidth: !isSelected && borderColor ? 1 : 0,
            borderColor: !isSelected ? borderColor : undefined,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            flexDirection: 'row',
            alignSelf: 'flex-start',
            gap: 4
          },
          style
        ]}
        {...rest}>
        {renderLeft && renderLeft()}
        <Text
          numberOfLines={1}
          variant={'buttonSmall'}
          style={{
            color: isSelected ? theme.colors.$surfacePrimary : tintColor
          }}>
          {children}
        </Text>
        {React.isValidElement(rightIcon) ? (
          rightIcon
        ) : typeof rightIcon === 'string' ? (
          <Icons.Navigation.ExpandMore
            width={iconWidth}
            height={iconWidth}
            color={alpha(theme.colors.$borderPrimary, 0.5)}
            style={{
              marginRight: -4
            }}
          />
        ) : null}
      </TouchableOpacity>
    )
  }
)

const sizeStyles = StyleSheet.create({
  large: {
    paddingHorizontal: 12,
    minHeight: 27,
    minWidth: 60
  },
  small: {
    paddingHorizontal: 10,
    minHeight: 20,
    minWidth: 57
  }
})

Chip.displayName = 'Chip'
