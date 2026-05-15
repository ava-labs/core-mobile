import { Text, View } from '../../Primitives'
import React, { FC, useState } from 'react'
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  activeIndex: SharedValue<number | null>
  isActive: SharedValue<boolean>
  /** Crosshair X position (chart-local pixels). Tooltip follows this. */
  x: SharedValue<number>
  /** Chart width — used to clamp the tooltip inside chart bounds. */
  width: number
}

const TOOLTIP_WIDTH = 160
const EDGE_PADDING = 8

const formatLocalTime = (ts: number): string => {
  const d = new Date(ts)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
  const datePart = sameDay
    ? 'Today'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${datePart}, ${time}`
}

const formatPrice = (n: number): string =>
  n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`

const formatDelta = (delta: number, pct: number): string => {
  const sign = delta >= 0 ? '+' : ''
  const arrow = delta >= 0 ? '▲' : '▼'
  return `${sign}$${delta.toFixed(2)} ${arrow} ${pct.toFixed(2)}%`
}

export const CrosshairTooltip: FC<Props> = ({
  candles,
  activeIndex,
  isActive,
  x,
  width
}) => {
  const [idx, setIdx] = useState<number | null>(null)

  // Bridge SharedValue<number | null> -> React state so we can render content.
  // useDerivedValue runs on UI thread; runOnJS marshals back to the JS thread.
  useDerivedValue(() => {
    runOnJS(setIdx)(activeIndex.value)
  })

  const animatedStyle = useAnimatedStyle(() => {
    const target = x.value - TOOLTIP_WIDTH / 2
    const min = EDGE_PADDING
    const max = width - TOOLTIP_WIDTH - EDGE_PADDING
    const clamped = Math.max(min, Math.min(max, target))
    return {
      opacity: isActive.value ? 1 : 0,
      transform: [{ translateX: clamped }]
    }
  })

  const candle = idx !== null ? candles[idx] : undefined
  const first = candles[0]
  const delta = candle && first ? candle.close - first.open : 0
  const pct = first && first.open !== 0 ? (delta / first.open) * 100 : 0

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: TOOLTIP_WIDTH,
          alignItems: 'center',
          paddingVertical: 4
        },
        animatedStyle
      ]}>
      {candle ? (
        <View sx={{ alignItems: 'center' }}>
          <Text variant="heading2">{formatPrice(candle.close)}</Text>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            {formatLocalTime(candle.ts)}
          </Text>
          <Text
            variant="caption"
            sx={{
              color: delta >= 0 ? '$textSuccess' : '$textDanger'
            }}>
            {formatDelta(delta, pct)}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  )
}
