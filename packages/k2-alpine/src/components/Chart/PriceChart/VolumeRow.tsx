import { Canvas, Path, RoundedRect, Skia } from '@shopify/react-native-skia'
import React, { FC, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { CHART_INSET } from './constants'
import { indexToX } from './helpers'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  width: number
  height: number
  /** When provided, each bar's opacity tracks the crosshair X — closest bars
   * pop to full opacity, falling off linearly within one candle's distance. */
  crosshairX?: SharedValue<number>
  isActive?: SharedValue<boolean>
}

const BAR_WIDTH_RATIO = 0.6
const IDLE_OPACITY = 0.1
const ACTIVE_OPACITY = 1
/** Sentinel for "nothing highlighted" — no candle index is ever negative. */
const NO_HIGHLIGHT = -1

type BarGeom = { x: number; barHeight: number; radius: number }

/**
 * CP-14918 item 2: this used to allocate one `makeMutable` PER candle
 * (N reanimated shareables registered synchronously on mount — most of the
 * chart's measured "~76 mutables/commit"), because the crosshair-following
 * highlight was modeled as "every bar has its own independent opacity."
 * Read closely, the falloff (`distance >= 1 ? IDLE : lerp(...)`) only ever
 * produces a non-idle opacity for the bar(s) immediately adjacent to the
 * crosshair's fractional index — every other bar is always exactly
 * `IDLE_OPACITY`. So the idle bars are baked into one static `SkPath` (its
 * geometry never changes once computed) and only the single nearest bar is
 * redrawn on top via one dynamic `RoundedRect`, driven by a single
 * `SharedValue<number>` fractional-index reaction instead of N independent
 * mutables. Bar geometry is mirrored into a SharedValue from an effect
 * (never captured directly inside a worklet closure) so the UI-thread
 * lookup never re-converts a fresh N-object array — same pattern as
 * PriceChart.tsx's item 4 fix.
 *
 * KNOWN VISUAL DELTA (see task-V-report.md): the original design let the
 * highlight crossfade continuously between the two candles straddling a
 * non-integer fractional index (both bars visible at partial opacity while
 * dragging between them). This restructure snaps to the single nearest
 * candle (`Math.round`) at full opacity instead of interpolating between
 * two — needs a visual pass on a real drag gesture to confirm it reads
 * the same to users.
 */
export const VolumeRow: FC<Props> = ({
  candles,
  width,
  height,
  crosshairX,
  isActive
}) => {
  const { theme } = useTheme()

  const innerWidth = Math.max(0, width - 2 * CHART_INSET)

  const allNull = useMemo(
    () => candles.every(c => c.volume === null),
    [candles]
  )
  const maxVolume = useMemo(
    () => candles.reduce((m, c) => Math.max(m, c.volume ?? 0), 0),
    [candles]
  )

  const slotWidth = candles.length > 0 ? innerWidth / candles.length : 0
  const barWidth = slotWidth * BAR_WIDTH_RATIO
  const barColor = theme.colors.$textPrimary ?? '#28282E'

  // Static per-bar geometry + one path covering every bar at IDLE_OPACITY.
  const { barGeom, idlePath } = useMemo(() => {
    const geom: BarGeom[] = []
    const path = Skia.Path.Make()
    if (maxVolume > 0) {
      candles.forEach((c, i) => {
        if (c.volume == null) {
          geom.push({ x: 0, barHeight: 0, radius: 0 })
          return
        }
        const xCenter = indexToX(i, candles.length, innerWidth) + CHART_INSET
        const barHeight = (c.volume / maxVolume) * height
        const x = xCenter - barWidth / 2
        const y = height - barHeight
        const radius = Math.min(barWidth, barHeight) / 2
        geom.push({ x, barHeight, radius })
        path.addRRect(
          Skia.RRectXY(Skia.XYWHRect(x, y, barWidth, barHeight), radius, radius)
        )
      })
    }
    return { barGeom: geom, idlePath: path }
  }, [candles, innerWidth, height, barWidth, maxVolume])

  // Mirrored into a SharedValue via an effect rather than closed over
  // directly inside the worklets below.
  const barGeomSV = useSharedValue<BarGeom[]>(barGeom)
  useEffect(() => {
    barGeomSV.value = barGeom
  }, [barGeom, barGeomSV])

  const nearestIndexSV = useSharedValue(NO_HIGHLIGHT)

  useAnimatedReaction(
    () => ({
      x: crosshairX?.value ?? 0,
      active: isActive?.value ?? false
    }),
    ({ x, active }) => {
      if (!active || candles.length <= 1 || innerWidth === 0) {
        nearestIndexSV.value = NO_HIGHLIGHT
        return
      }
      const last = candles.length - 1
      const fracIndex = Math.max(
        0,
        Math.min(last, ((x - CHART_INSET) / innerWidth) * last)
      )
      nearestIndexSV.value = Math.round(fracIndex)
    },
    [candles.length, innerWidth]
  )

  const highlightOpacity = useDerivedValue(() =>
    nearestIndexSV.value === NO_HIGHLIGHT ? 0 : ACTIVE_OPACITY
  )
  const highlightX = useDerivedValue(() => {
    const i = nearestIndexSV.value
    if (i === NO_HIGHLIGHT) return 0
    const g = barGeomSV.value[i]
    return g ? g.x : 0
  })
  const highlightY = useDerivedValue(() => {
    const i = nearestIndexSV.value
    if (i === NO_HIGHLIGHT) return 0
    const g = barGeomSV.value[i]
    return g ? height - g.barHeight : 0
  })
  const highlightHeight = useDerivedValue(() => {
    const i = nearestIndexSV.value
    if (i === NO_HIGHLIGHT) return 0
    const g = barGeomSV.value[i]
    return g ? g.barHeight : 0
  })
  const highlightRadius = useDerivedValue(() => {
    const i = nearestIndexSV.value
    if (i === NO_HIGHLIGHT) return 0
    const g = barGeomSV.value[i]
    return g ? g.radius : 0
  })

  if (allNull || maxVolume === 0 || candles.length === 0) return null

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        <Path path={idlePath} color={barColor} opacity={IDLE_OPACITY} />
        <RoundedRect
          x={highlightX}
          y={highlightY}
          width={barWidth}
          height={highlightHeight}
          r={highlightRadius}
          color={barColor}
          opacity={highlightOpacity}
        />
      </Canvas>
    </View>
  )
}
