import { useTheme } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

type Props = {
  /** Same crosshair X SharedValue used by the Crosshair line so the dot
   * tracks it pixel-for-pixel — no separate animation pipeline. */
  x: SharedValue<number>
  /** Y position on the close-price line at the crosshair X. */
  y: SharedValue<number>
  isActive: SharedValue<boolean>
  /** Diameter of the dot in pixels. */
  size?: number
}

/**
 * Filled dot rendered as an Animated.View — uses the same RN transform
 * pipeline as the Crosshair line so the two stay perfectly synced.
 */
export const LineChartDot: FC<Props> = ({ x, y, isActive, size = 9 }) => {
  const { theme } = useTheme()
  const color = theme.colors.$textPrimary ?? '#000'

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isActive.value ? 1 : 0,
    transform: [
      { translateX: x.value - size / 2 },
      { translateY: y.value - size / 2 }
    ]
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  )
}
