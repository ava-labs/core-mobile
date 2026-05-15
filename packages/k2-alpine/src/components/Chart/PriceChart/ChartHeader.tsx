import React, { FC, useCallback, useMemo } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { Text } from '../../Primitives'
import { DURATIONS } from './constants'
import { formatActiveTime } from './helpers'
import { useActiveIndex } from './hooks'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  symbol: string
  activeIndex: SharedValue<number | null>
  crosshairX: SharedValue<number>
  isActive: SharedValue<boolean>
  containerWidth: number
}

const LEFT_ZONE_THRESHOLD = 0.19
const RIGHT_ZONE_THRESHOLD = 0.81

export const ChartHeader: FC<Props> = ({
  candles,
  symbol,
  activeIndex,
  crosshairX,
  isActive,
  containerWidth
}) => {
  const idx = useActiveIndex(activeIndex)

  const blockWidth = useSharedValue(0)
  const priceWidth = useSharedValue(0)
  const subtitleWidth = useSharedValue(0)
  const deltaWidth = useSharedValue(0)
  const progress = useSharedValue(0)
  // 0 = flex-start, 0.5 = center, 1 = flex-end.
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
    () => {
      const cw = containerWidth
      if (!isActive.value || cw <= 0) return 0
      const x = crosshairX.value
      if (x > RIGHT_ZONE_THRESHOLD * cw) return 1
      if (x > LEFT_ZONE_THRESHOLD * cw) return 0.5
      return 0
    },
    target => {
      innerAnchor.value = withTiming(target, {
        duration: DURATIONS.headerZone
      })
    }
  )

  const blockStyle = useAnimatedStyle(() => {
    const cw = containerWidth
    const w = blockWidth.value
    // Center the block on the crosshair, stopping 16px from each chart edge.
    const target = crosshairX.value - w / 2 - 16
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

  // Pre-compute display strings once per `candles` ref so per-frame
  // re-renders during drag are array lookups — no Date/toLocaleString work.
  const formatted = useMemo(() => {
    const firstOpen = candles[0]?.open ?? 0
    return candles.map(c => {
      const close = Number.isFinite(c.close) ? c.close : 0
      const delta = close - firstOpen
      const deltaPct =
        Number.isFinite(firstOpen) && firstOpen !== 0
          ? (delta / firstOpen) * 100
          : 0
      const safeDelta = Number.isFinite(delta) ? delta : 0
      const safeDeltaPct = Number.isFinite(deltaPct) ? deltaPct : 0
      const isPositive = safeDelta >= 0
      return {
        priceText: `$${close.toFixed(2)}`,
        timeText: formatActiveTime(c.ts),
        deltaAmountText: `${isPositive ? '+' : '-'}$${Math.abs(
          safeDelta
        ).toFixed(2)}`,
        deltaArrowText: isPositive ? '▲' : '▼',
        deltaPctText: `${Math.abs(safeDeltaPct).toFixed(2)}%`,
        isPositive
      }
    })
  }, [candles])

  const idleStrings = formatted[formatted.length - 1]
  const active = idx !== null ? formatted[idx] : undefined
  const displayed = active ?? idleStrings

  return (
    <View style={{ paddingHorizontal: 16, alignItems: 'flex-start' }}>
      <Animated.View
        onLayout={onBlockLayout}
        style={[blockStyle, { alignItems: 'flex-start' }]}>
        <Animated.View onLayout={onPriceLayout} style={priceStyle}>
          <Text variant="heading3">{displayed?.priceText ?? '$0.00'}</Text>
        </Animated.View>
        <Animated.View onLayout={onSubtitleLayout} style={subtitleStyle}>
          <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
            {active ? active.timeText : `Current price of ${symbol}`}
          </Text>
        </Animated.View>
        <Animated.View
          onLayout={onDeltaLayout}
          style={[deltaStyle, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text
            variant="body2"
            sx={{
              fontFamily: 'Inter-SemiBold',
              color: displayed?.isPositive ? '$textSuccess' : '$textDanger'
            }}>
            {displayed?.deltaAmountText ?? '$0.00'}
          </Text>
          <Text
            variant="body2"
            sx={{
              fontFamily: 'Inter-SemiBold',
              marginLeft: 4,
              marginRight: 4,
              color: displayed?.isPositive ? '$textSuccess' : '$textDanger'
            }}>
            {displayed?.deltaArrowText ?? '▲'}
          </Text>
          <Text variant="body2" sx={{ fontFamily: 'Inter-Medium' }}>
            {displayed?.deltaPctText ?? '0.00%'}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  )
}
