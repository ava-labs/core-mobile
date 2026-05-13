import { useTheme } from '@avalabs/k2-alpine'
import { Canvas, RoundedRect } from '@shopify/react-native-skia'
import React, { FC, useMemo } from 'react'
import { View } from 'react-native'
import {
  makeMutable,
  SharedValue,
  useAnimatedReaction
} from 'react-native-reanimated'
import { CHART_INSET } from './constants'
import { indexToX } from './helpers'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  width: number
  height: number
  /** When provided, each bar's opacity tracks the crosshair X — bars closest
   * to it pop to full opacity, falling off linearly to idle within one
   * candle's distance. */
  crosshairX?: SharedValue<number>
  isActive?: SharedValue<boolean>
}

const BAR_WIDTH_RATIO = 0.6
const IDLE_OPACITY = 0.1
const ACTIVE_OPACITY = 1

export const VolumeRow: FC<Props> = ({
  candles,
  width,
  height,
  crosshairX,
  isActive
}) => {
  const { theme } = useTheme()

  // One SharedValue per bar so opacity updates stay on the UI thread (no JS
  // re-renders during drag). Recreated when the candle count changes.
  const opacities = useMemo(
    () => Array.from({ length: candles.length }, () => makeMutable(IDLE_OPACITY)),
    [candles.length]
  )

  const innerWidth = Math.max(0, width - 2 * CHART_INSET)

  useAnimatedReaction(
    () => ({
      x: crosshairX?.value ?? 0,
      active: isActive?.value ?? false
    }),
    ({ x, active }) => {
      if (!active || candles.length <= 1 || innerWidth === 0) {
        for (const o of opacities) {
          o.value = IDLE_OPACITY
        }
        return
      }
      const last = candles.length - 1
      const fracIndex = Math.max(
        0,
        Math.min(last, ((x - CHART_INSET) / innerWidth) * last)
      )
      for (let i = 0; i < opacities.length; i++) {
        const o = opacities[i]
        if (!o) continue
        const distance = Math.abs(fracIndex - i)
        o.value =
          distance >= 1
            ? IDLE_OPACITY
            : ACTIVE_OPACITY - (ACTIVE_OPACITY - IDLE_OPACITY) * distance
      }
    },
    [candles.length, innerWidth]
  )

  // If every candle has null volume, render nothing.
  const allNull = useMemo(
    () => candles.every(c => c.volume === null),
    [candles]
  )
  const maxVolume = useMemo(
    () => candles.reduce((m, c) => Math.max(m, c.volume ?? 0), 0),
    [candles]
  )

  if (allNull || maxVolume === 0 || candles.length === 0) return null

  const slotWidth = innerWidth / candles.length
  const barWidth = slotWidth * BAR_WIDTH_RATIO
  // Per Figma: all volume bars are a neutral gray (textPrimary @ 10%).
  // Opacity is animated per-bar based on crosshair distance.
  const barColor = theme.colors.$textPrimary ?? '#28282E'

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {candles.map((c, i) => {
          if (c.volume == null) return null
          const xCenter =
            indexToX(i, candles.length, innerWidth) + CHART_INSET
          const x = xCenter - barWidth / 2
          const barHeight = (c.volume / maxVolume) * height
          const y = height - barHeight
          const radius = Math.min(barWidth, barHeight) / 2
          const opacity = opacities[i] ?? IDLE_OPACITY
          return (
            <RoundedRect
              key={c.ts}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              r={radius}
              color={barColor}
              opacity={opacity}
            />
          )
        })}
      </Canvas>
    </View>
  )
}
