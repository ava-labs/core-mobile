import React, { forwardRef, PropsWithChildren } from 'react'
import {
  Insets,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle
} from 'react-native'
import { Text } from '../Primitives'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { alpha } from '../../utils'

export type ChipSize = 'small' | 'large'

type ChipIconType = 'expandMore'

interface ChipProps {
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  size: ChipSize
  rightIcon?: ChipIconType | JSX.Element
  hitSlop?: number | Insets
}

export const Chip = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ChipProps & PropsWithChildren
>(({ size, rightIcon, style, children, testID, ...rest }, ref) => {
  const { theme } = useTheme()

  const tintColor = theme.colors.$textPrimary
  const backgroundColor = theme.colors.$surfaceSecondary
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
          alignSelf: 'flex-start'
        },
        style
      ]}
      {...rest}>
      <Text
        numberOfLines={1}
        variant={'buttonSmall'}
        adjustsFontSizeToFit={Platform.OS === 'ios'}
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
          style={{ marginLeft: 4 }}
        />
      ) : null}
    </TouchableOpacity>
  )
})

const sizeStyles = StyleSheet.create({
  large: {
    paddingHorizontal: 11,
    minHeight: 27,
    minWidth: 65
  },
  small: {
    paddingHorizontal: 8,
    minHeight: 21,
    minWidth: 57
  }
})

Chip.displayName = 'Chip'
