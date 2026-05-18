import { useCallback } from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import type { AnimatedStyle } from 'react-native-reanimated'
import { DURATIONS } from './constants'
import { crosshairInnerAnchorTarget } from './helpers'

const useLayoutWidthHandler = (
  width: SharedValue<number>
): ((e: LayoutChangeEvent) => void) =>
  useCallback(
    (e: LayoutChangeEvent) => {
      width.value = e.nativeEvent.layout.width
    },
    [width]
  )

const useAnchorTranslateStyle = (
  innerAnchor: SharedValue<number>,
  blockWidth: SharedValue<number>,
  elementWidth: SharedValue<number>
): AnimatedStyle<ViewStyle> =>
  useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          innerAnchor.value * Math.max(0, blockWidth.value - elementWidth.value)
      }
    ]
  }))

type ChartHeaderAnimations = {
  blockStyle: AnimatedStyle<ViewStyle>
  priceStyle: AnimatedStyle<ViewStyle>
  subtitleStyle: AnimatedStyle<ViewStyle>
  deltaStyle: AnimatedStyle<ViewStyle>
  chevronStyle: AnimatedStyle<ViewStyle>
  onBlockLayout: (e: LayoutChangeEvent) => void
  onPriceLayout: (e: LayoutChangeEvent) => void
  onSubtitleLayout: (e: LayoutChangeEvent) => void
  onDeltaLayout: (e: LayoutChangeEvent) => void
}

export const useChartHeaderAnimations = (
  containerWidth: number,
  crosshairX: SharedValue<number>,
  isActive: SharedValue<boolean>
): ChartHeaderAnimations => {
  const blockWidth = useSharedValue(0)
  const priceWidth = useSharedValue(0)
  const subtitleWidth = useSharedValue(0)
  const deltaWidth = useSharedValue(0)
  const progress = useSharedValue(0)
  const innerAnchor = useSharedValue(0)

  useAnimatedReaction(
    () => isActive.value,
    active => {
      progress.value = withTiming(active ? 1 : 0, {
        duration: DURATIONS.headerPress
      })
    }
  )

  useAnimatedReaction(
    () =>
      crosshairInnerAnchorTarget(
        isActive.value,
        crosshairX.value,
        containerWidth
      ),
    target => {
      innerAnchor.value = withTiming(target, {
        duration: DURATIONS.headerZone
      })
    }
  )

  const blockStyle = useAnimatedStyle(() => {
    const cw = containerWidth
    const w = blockWidth.value
    const target = crosshairX.value - w / 2 - 16
    const minX = 0
    const maxX = Math.max(minX, cw - w - 32)
    const clamped = Math.max(minX, Math.min(maxX, target))
    return {
      transform: [{ translateX: clamped * progress.value }]
    }
  })

  const priceStyle = useAnchorTranslateStyle(
    innerAnchor,
    blockWidth,
    priceWidth
  )
  const subtitleStyle = useAnchorTranslateStyle(
    innerAnchor,
    blockWidth,
    subtitleWidth
  )
  const deltaStyle = useAnchorTranslateStyle(
    innerAnchor,
    blockWidth,
    deltaWidth
  )

  const chevronStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value
  }))

  return {
    blockStyle,
    priceStyle,
    subtitleStyle,
    deltaStyle,
    chevronStyle,
    onBlockLayout: useLayoutWidthHandler(blockWidth),
    onPriceLayout: useLayoutWidthHandler(priceWidth),
    onSubtitleLayout: useLayoutWidthHandler(subtitleWidth),
    onDeltaLayout: useLayoutWidthHandler(deltaWidth)
  }
}
