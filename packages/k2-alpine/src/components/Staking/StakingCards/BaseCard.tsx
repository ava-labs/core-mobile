import React from 'react'
import { SxProp } from 'dripsy'
import { useTheme } from '../../../hooks'
import { AnimatedPressable } from '../../Animated/AnimatedPressable'
import { View } from '../../Primitives'

export const BaseCard = ({
  onPress,
  sx,
  children,
  disabled
}: {
  onPress?: () => void
  sx?: SxProp
  children: React.ReactNode
  disabled?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const borderColor = theme.isDark ? '#FFFFFF1A' : '#0000001A'

  return (
    <AnimatedPressable
      style={{ flex: 1 }}
      onPress={onPress}
      disabled={disabled}>
      <View
        sx={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor,
          backgroundColor: '$surfaceSecondary',
          overflow: 'hidden',
          ...sx
        }}>
        {children}
      </View>
    </AnimatedPressable>
  )
}

export const DEFAULT_CARD_WIDTH = 200

export const getCardHeight = (width: number): number => {
  const ratio = 5 / 4
  const minHeight = 210

  return Math.floor(Math.max(width * ratio, minHeight))
}
