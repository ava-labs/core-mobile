import { alpha, useTheme } from '@avalabs/k2-alpine'
import { useEffect, useRef } from 'react'
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle
} from 'react-native-reanimated'
import type { ViewStyle } from 'react-native'

/**
 * Returns an animated style that briefly flashes a background highlight green
 * when `price` ticks up and red when it ticks down, fading back to transparent.
 * Apply it to an `Animated.View` wrapping the price text. No flash on first
 * render (only on subsequent changes).
 */
export const usePriceFlash = (price: number): AnimatedStyle<ViewStyle> => {
  const { theme } = useTheme()
  const flash = useSharedValue(0)
  const prevPriceRef = useRef(price)

  useEffect(() => {
    const prev = prevPriceRef.current
    if (price > prev) {
      flash.value = 1
      flash.value = withTiming(0, { duration: 700 })
    } else if (price < prev) {
      flash.value = -1
      flash.value = withTiming(0, { duration: 700 })
    }
    prevPriceRef.current = price
  }, [price, flash])

  const successTransparent = alpha(theme.colors.$textSuccess, 0)
  const successBg = alpha(theme.colors.$textSuccess, 0.28)
  const dangerTransparent = alpha(theme.colors.$textDanger, 0)
  const dangerBg = alpha(theme.colors.$textDanger, 0.28)

  return useAnimatedStyle(() => {
    const v = flash.value
    const up = v >= 0
    return {
      backgroundColor: interpolateColor(
        Math.abs(v),
        [0, 1],
        [up ? successTransparent : dangerTransparent, up ? successBg : dangerBg]
      )
    }
  })
}
