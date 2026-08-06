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
import {
  crossfadeRectOpacity,
  IDLE_VOLUME_CROSSFADE,
  indexToX,
  NO_HIGHLIGHT_INDEX,
  VOLUME_IDLE_OPACITY,
  volumeCrosshairWeights
} from './helpers'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  width: number
  height: number
  /** When provided, the two candles nearest the crosshair X crossfade —
   * the closer one pops toward full opacity, the other falls back toward
   * idle, linearly within one candle's distance. */
  crosshairX?: SharedValue<number>
  isActive?: SharedValue<boolean>
}

const BAR_WIDTH_RATIO = 0.6

type BarGeom = { x: number; barHeight: number; radius: number }

/**
 * Bar highlight: one static `SkPath` for idle bars + two dynamic
 * `RoundedRect`s for the two nearest bars, driven by a single `SharedValue`
 * holding both indices and their crossfade weights (was: one `makeMutable`
 * per candle). Crossfades between the two nearest candles exactly like
 * main's original per-candle implementation — see `volumeCrosshairWeights`
 * in `helpers.ts` for the interpolation this restores. Because the
 * highlight rects paint on top of the idle `Path` (which already painted
 * those same bars), their opacity is compositing-compensated via
 * `crossfadeRectOpacity` so `idlePath + rect` composes to main's per-bar
 * target opacity exactly, not a double-counted overshoot. CP-14918 item 2.
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

  // Static per-bar geometry + one path covering every bar at
  // VOLUME_IDLE_OPACITY.
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

  const crossfadeSV = useSharedValue(IDLE_VOLUME_CROSSFADE)

  useAnimatedReaction(
    () => ({
      x: crosshairX?.value ?? 0,
      active: isActive?.value ?? false
    }),
    ({ x, active }) => {
      crossfadeSV.value = active
        ? volumeCrosshairWeights(x, candles.length, innerWidth)
        : IDLE_VOLUME_CROSSFADE
    },
    [candles.length, innerWidth]
  )

  // Low bar — the candle at or just below the crosshair. Opacity is
  // compositing-compensated (see `crossfadeRectOpacity`) since this rect
  // paints on top of `idlePath`, which already painted the same bar.
  const lowOpacity = useDerivedValue(() => {
    const c = crossfadeSV.value
    return c.lowIndex === NO_HIGHLIGHT_INDEX
      ? 0
      : crossfadeRectOpacity(c.lowWeight)
  })
  const lowX = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.lowIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.lowIndex]
    return g ? g.x : 0
  })
  const lowY = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.lowIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.lowIndex]
    return g ? height - g.barHeight : 0
  })
  const lowHeight = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.lowIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.lowIndex]
    return g ? g.barHeight : 0
  })
  const lowRadius = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.lowIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.lowIndex]
    return g ? g.radius : 0
  })

  // High bar — the candle at or just above the crosshair. Same compositing
  // compensation as `lowOpacity` above.
  const highOpacity = useDerivedValue(() => {
    const c = crossfadeSV.value
    return c.highIndex === NO_HIGHLIGHT_INDEX
      ? 0
      : crossfadeRectOpacity(c.highWeight)
  })
  const highX = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.highIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.highIndex]
    return g ? g.x : 0
  })
  const highY = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.highIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.highIndex]
    return g ? height - g.barHeight : 0
  })
  const highHeight = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.highIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.highIndex]
    return g ? g.barHeight : 0
  })
  const highRadius = useDerivedValue(() => {
    const c = crossfadeSV.value
    if (c.highIndex === NO_HIGHLIGHT_INDEX) return 0
    const g = barGeomSV.value[c.highIndex]
    return g ? g.radius : 0
  })

  if (allNull || maxVolume === 0 || candles.length === 0) return null

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        <Path path={idlePath} color={barColor} opacity={VOLUME_IDLE_OPACITY} />
        <RoundedRect
          x={lowX}
          y={lowY}
          width={barWidth}
          height={lowHeight}
          r={lowRadius}
          color={barColor}
          opacity={lowOpacity}
        />
        <RoundedRect
          x={highX}
          y={highY}
          width={barWidth}
          height={highHeight}
          r={highRadius}
          color={barColor}
          opacity={highOpacity}
        />
      </Canvas>
    </View>
  )
}
