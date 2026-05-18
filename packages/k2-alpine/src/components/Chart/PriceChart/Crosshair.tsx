import React, { FC } from 'react'
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'

type Props = {
  x: SharedValue<number>
  isActive: SharedValue<boolean>
  height: number
  topOffset?: number
  /** Pixel amount to shrink the line from the bottom — used to stop the
   * crosshair at the top of the highlighted volume bar. */
  bottomInset?: SharedValue<number>
  width?: number
}

const DEFAULT_CROSSHAIR_WIDTH = 3

export const Crosshair: FC<Props> = ({
  x,
  isActive,
  height,
  topOffset = 0,
  bottomInset,
  width = DEFAULT_CROSSHAIR_WIDTH
}) => {
  const { theme } = useTheme()
  const color = theme.colors.$textPrimary ?? '#000'

  const opacity = useSharedValue(0)
  useAnimatedReaction(
    () => isActive.value,
    active => {
      opacity.value = withTiming(active ? 1 : 0, {
        duration: active ? 120 : 180,
        easing: Easing.out(Easing.quad)
      })
    }
  )

  const animatedStyle = useAnimatedStyle(() => {
    const inset = bottomInset?.value ?? 0
    return {
      opacity: opacity.value,
      transform: [{ translateX: x.value - width / 2 }],
      height: Math.max(0, height - inset)
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: topOffset,
          left: 0,
          width,
          borderRadius: width / 2,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  )
}
