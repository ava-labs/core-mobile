import { Text } from '@avalabs/k2-alpine'
import React, { FC, useState } from 'react'
import { View } from 'react-native'
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated'
import { formatLastUpdate, formatVolume } from './helpers'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  activeIndex: SharedValue<number | null>
  isActive: SharedValue<boolean>
  /** Crosshair X (chart-local px). The active "Vol. …" text follows this. */
  x: SharedValue<number>
  /** Chart width — used to clamp the active overlay inside chart bounds. */
  width: number
  height: number
  /** When false, the footer keeps showing "Last update: …" even while pressed
   * (used in line/area mode where volume isn't displayed). Defaults to true. */
  showVolume?: boolean
}

const VOLUME_WIDTH = 140
const EDGE_PADDING = 8

/**
 * Footer row rendered below the volume row. Shows "Last updated …" when idle
 * and the active candle's volume when the user is pressing the chart.
 */
export const ChartFooter: FC<Props> = ({
  candles,
  activeIndex,
  isActive,
  x,
  width,
  height,
  showVolume = true
}) => {
  const [idx, setIdx] = useState<number | null>(null)

  useDerivedValue(() => {
    runOnJS(setIdx)(activeIndex.value)
  })

  const idleStyle = useAnimatedStyle(() => ({
    opacity: showVolume && isActive.value ? 0 : 1
  }))
  const activeStyle = useAnimatedStyle(() => {
    const target = x.value - VOLUME_WIDTH / 2
    const min = EDGE_PADDING
    const max = width - VOLUME_WIDTH - EDGE_PADDING
    const clamped = Math.max(min, Math.min(max, target))
    return {
      opacity: showVolume && isActive.value ? 1 : 0,
      transform: [{ translateX: clamped }]
    }
  })

  const latest = candles[candles.length - 1]
  const idleText = latest ? formatLastUpdate(latest.ts) : ''

  const activeCandle = idx !== null ? candles[idx] : undefined
  const activeText =
    activeCandle && activeCandle.volume != null
      ? formatVolume(activeCandle.volume)
      : ''

  return (
    <View
      style={{
        height,
        justifyContent: 'center'
      }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 16,
            right: 16,
            alignItems: 'center'
          },
          idleStyle
        ]}>
        <Text
          sx={{
            fontSize: 11,
            fontWeight: '500',
            color: '$textSecondary',
            textAlign: 'center'
          }}>
          {idleText}
        </Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            width: VOLUME_WIDTH,
            alignItems: 'center'
          },
          activeStyle
        ]}>
        <Text
          sx={{
            fontSize: 11,
            fontWeight: '600',
            color: '$textPrimary',
            textAlign: 'center'
          }}>
          {activeText}
        </Text>
      </Animated.View>
    </View>
  )
}
