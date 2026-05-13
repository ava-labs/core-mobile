import { useTheme } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

type Props = {
  /** X position of the crosshair in chart-local pixels. */
  x: SharedValue<number>
  /** Whether the crosshair is currently visible (driven by gesture state). */
  isActive: SharedValue<boolean>
  height: number
  /** Pixel amount to shrink the line from the bottom — used to stop the
   * crosshair at the top of the highlighted volume bar. */
  bottomInset?: SharedValue<number>
}

/**
 * Vertical line drawn as a 1px-wide Animated.View, translated by a Reanimated
 * shared value. Runs on the UI thread; no JS-thread cost during finger drag.
 * Skia's declarative Line API doesn't accept SharedValue props, so we use RN
 * primitives for the crosshair specifically.
 */
const CROSSHAIR_WIDTH = 3

export const Crosshair: FC<Props> = ({
  x,
  isActive,
  height,
  bottomInset
}) => {
  const { theme } = useTheme()
  const color = theme.colors.$textPrimary ?? '#000'

  const animatedStyle = useAnimatedStyle(() => {
    const inset = bottomInset?.value ?? 0
    return {
      opacity: isActive.value ? 1 : 0,
      // Center the 3px line on the touch point.
      transform: [{ translateX: x.value - CROSSHAIR_WIDTH / 2 }],
      height: Math.max(0, height - inset)
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0, // translateX moves the line from x=0
          width: CROSSHAIR_WIDTH,
          borderRadius: CROSSHAIR_WIDTH / 2,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  )
}
