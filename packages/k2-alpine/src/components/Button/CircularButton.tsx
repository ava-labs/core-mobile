import React, { forwardRef, PropsWithChildren } from 'react'
import {
  StyleProp,
  TouchableOpacity,
  ViewStyle,
  View as RNView
} from 'react-native'
import { View, Text } from '../Primitives'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { alpha, overlayColor } from '../../utils/colors'
import { K2AlpineTheme } from '../../theme/theme'
import { useTheme } from '../../hooks'

interface CircularButtonProps {
  title?: string
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const CircularButton = forwardRef<
  RNView,
  CircularButtonProps & PropsWithChildren
>(({ title, disabled, style, children, testID, ...rest }, ref) => {
  const { theme } = useTheme()

  const tintColor = getTintColor(theme, disabled)

  const coloredChildren = React.isValidElement(children)
    ? React.cloneElement(children, {
        // @ts-expect-error color is a valid prop
        color: tintColor
      })
    : children

  const backgroundColor = getBackgroundColor(theme, disabled)

  return (
    <TouchableOpacity
      ref={ref}
      accessible={false}
      testID={testID}
      disabled={disabled}
      {...rest}>
      <View sx={{ gap: 8, alignItems: 'center' }}>
        <View
          style={[
            {
              borderRadius: 1000,
              alignItems: 'center',
              width: CIRCULAR_BUTTON_WIDTH,
              height: CIRCULAR_BUTTON_WIDTH,
              backgroundColor,
              justifyContent: 'center',
              overflow: 'hidden'
            },
            style
          ]}>
          {coloredChildren}
        </View>
        {title && <Text variant="subtitle2">{title}</Text>}
      </View>
    </TouchableOpacity>
  )
})

const getBackgroundColor = (
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
          alpha(darkModeColors.$surfaceSecondary, 0.3),
          lightModeColors.$surfacePrimary
        )
  }

  return theme.colors.$surfaceSecondary
}

const getTintColor = (
  theme: K2AlpineTheme,
  disabled: boolean | undefined
): string => {
  if (disabled) {
    return theme.isDark
      ? lightModeColors.$textPrimary
      : darkModeColors.$textPrimary
  }

  return theme.colors.$textPrimary
}

CircularButton.displayName = 'Button'

export const CIRCULAR_BUTTON_WIDTH = 60
