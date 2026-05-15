import { Text } from '../../Primitives'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  symbol: string
  activeIndex: SharedValue<number | null>
  crosshairX: SharedValue<number>
  isActive: SharedValue<boolean>
  /** Total chart width — used to clamp the slide so the block never runs
   * off-screen at the edges. */
  containerWidth: number
}

/** Fraction of the chart width where the left zone ends. */
const LEFT_ZONE_THRESHOLD = 0.19
/** Fraction of the chart width where the right zone begins. */
const RIGHT_ZONE_THRESHOLD = 0.81

const formatActiveTime = (ts: number): string => {
  const d = new Date(ts)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const datePart = sameDay
    ? 'Today'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  })
  return `${datePart}, ${timePart}`
}

/**
 * Persistent chart header showing the price/time/delta of either the latest
 * candle (idle) or the active candle (while pressing). The whole block
 * slides continuously with the crosshair X, and each text inside slides
 * smoothly between flex-start / center / flex-end positions based on which
 * third of the chart the crosshair is in.
 *
 * Re-renders happen only when the active candle index changes — never per
 * gesture frame — so updates feel instant.
 */
export const ChartHeader: FC<Props> = ({
  candles,
  symbol,
  activeIndex,
  crosshairX,
  isActive,
  containerWidth
}) => {
  const [idx, setIdx] = useState<number | null>(null)

  useDerivedValue(() => {
    runOnJS(setIdx)(activeIndex.value)
  })

  const blockWidth = useSharedValue(0)
  const priceWidth = useSharedValue(0)
  const subtitleWidth = useSharedValue(0)
  const deltaWidth = useSharedValue(0)
  const progress = useSharedValue(0)
  // 0 = flex-start, 0.5 = center, 1 = flex-end. Animated via withTiming.
  const innerAnchor = useSharedValue(0)

  useAnimatedReaction(
    () => isActive.value,
    active => {
      progress.value = withTiming(active ? 1 : 0, { duration: 200 })
    }
  )

  useAnimatedReaction(
    () => {
      const cw = containerWidth
      if (!isActive.value || cw <= 0) return 0
      const x = crosshairX.value
      if (x > RIGHT_ZONE_THRESHOLD * cw) return 1
      if (x > LEFT_ZONE_THRESHOLD * cw) return 0.5
      return 0
    },
    target => {
      innerAnchor.value = withTiming(target, { duration: 220 })
    }
  )

  const blockStyle = useAnimatedStyle(() => {
    const cw = containerWidth
    const w = blockWidth.value
    // Center the block on the crosshair. Clamp only so the block sits flush
    // with the chart edges (no padding inset), so it stays tracked with the
    // finger across as much of the chart as possible.
    const target = crosshairX.value - w / 2 - 16
    // Stop 16px from each chart edge.
    const minX = 0
    const maxX = Math.max(minX, cw - w - 32)
    const clamped = Math.max(minX, Math.min(maxX, target))
    return {
      transform: [{ translateX: clamped * progress.value }]
    }
  })

  const priceStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          innerAnchor.value * Math.max(0, blockWidth.value - priceWidth.value)
      }
    ]
  }))

  const subtitleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          innerAnchor.value *
          Math.max(0, blockWidth.value - subtitleWidth.value)
      }
    ]
  }))

  const deltaStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          innerAnchor.value * Math.max(0, blockWidth.value - deltaWidth.value)
      }
    ]
  }))

  const onBlockLayout = useCallback(
    (e: LayoutChangeEvent) => {
      blockWidth.value = e.nativeEvent.layout.width
    },
    [blockWidth]
  )

  const onPriceLayout = useCallback(
    (e: LayoutChangeEvent) => {
      priceWidth.value = e.nativeEvent.layout.width
    },
    [priceWidth]
  )

  const onSubtitleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      subtitleWidth.value = e.nativeEvent.layout.width
    },
    [subtitleWidth]
  )

  const onDeltaLayout = useCallback(
    (e: LayoutChangeEvent) => {
      deltaWidth.value = e.nativeEvent.layout.width
    },
    [deltaWidth]
  )

  const latest = candles[candles.length - 1]
  const first = candles[0]
  const active = idx !== null ? candles[idx] : undefined
  const displayed = active ?? latest
  const delta = displayed && first ? displayed.close - first.open : 0
  const deltaPct = first && first.open !== 0 ? (delta / first.open) * 100 : 0

  const formattedActiveTime = useMemo(
    () => (active ? formatActiveTime(active.ts) : undefined),
    [active]
  )

  return (
    <View style={{ paddingHorizontal: 16, alignItems: 'flex-start' }}>
      <Animated.View
        onLayout={onBlockLayout}
        style={[blockStyle, { alignItems: 'flex-start' }]}>
        <Animated.View onLayout={onPriceLayout} style={priceStyle}>
          <Text variant="heading3">
            {displayed ? `$${displayed.close.toFixed(2)}` : '$0.00'}
          </Text>
        </Animated.View>
        <Animated.View onLayout={onSubtitleLayout} style={subtitleStyle}>
          <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
            {formattedActiveTime ?? `Current price of ${symbol}`}
          </Text>
        </Animated.View>
        <Animated.View
          onLayout={onDeltaLayout}
          style={[deltaStyle, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text
            sx={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 14,
              lineHeight: 18,
              color: delta >= 0 ? '$textSuccess' : '$textDanger'
            }}>
            {delta >= 0 ? '+' : '-'}${Math.abs(delta).toFixed(2)}
          </Text>
          <Text
            sx={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 14,
              lineHeight: 18,
              marginLeft: 4,
              marginRight: 4,
              color: delta >= 0 ? '$textSuccess' : '$textDanger'
            }}>
            {delta >= 0 ? '▲' : '▼'}
          </Text>
          <Text
            sx={{
              fontFamily: 'Inter-Medium',
              fontSize: 14,
              lineHeight: 18,
              color: '$textPrimary'
            }}>
            {Math.abs(deltaPct).toFixed(2)}%
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  )
}
