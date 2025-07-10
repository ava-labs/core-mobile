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
  testID?: string
  size: ChipSize
  variant?: ChipVariant
  rightIcon?: ChipIconType | JSX.Element
  hitSlop?: number | Insets
  renderLeft?: () => JSX.Element
}

export const Chip = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ChipProps & PropsWithChildren
>(
  (
    {
      size,
      variant = 'light',
      rightIcon,
      style,
      children,
      testID,
      renderLeft,
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
    const backgroundColor = {
      light: theme.colors.$surfaceSecondary,
      dark: alpha(colors.$neutral700, 0.8)
    }[variant]
    const iconWidth = { large: 20, small: 16 }[size]

    return (
      <TouchableOpacity
        ref={ref}
        accessible={false}
        testID={testID}
        style={[
          {
            ...sizeStyles[size],
            borderRadius: 1000,
            backgroundColor,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            flexDirection: 'row',
            alignSelf: 'flex-start',
            gap: 2
          },
          style
        ]}
        {...rest}>
        {renderLeft && renderLeft()}
        <Text
          numberOfLines={1}
          variant={'buttonSmall'}
          style={{
            color: tintColor
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
