import {
  Group,
  Text as SkText,
  type SkFont
} from '@shopify/react-native-skia'
import React, { FC, useMemo } from 'react'
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { DURATIONS } from './constants'
import { YAxisTick } from './types'

type Props = {
  isActive: SharedValue<boolean>
  /** Pre-computed tick positions matching the gridline y's, so labels stay
   * locked to their gridlines (including any edge clamping). */
  ticks: YAxisTick[]
  /** Skia font for the labels — loaded once in the parent (`useFont`).
   * Renders nothing while the font is still loading. */
  font: SkFont | null
  /** Label color — typically theme `$textPrimary`. Opacity is animated
   * separately and multiplies onto this. */
  color: string
}

const LABEL_LEFT = 16
const LABEL_GAP_ABOVE_LINE = 6
const PEAK_OPACITY = 0.3

const formatLabel = (n: number): string =>
  n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`

/**
 * Y-axis price labels rendered as Skia text directly inside the chart
 * Canvas — no JS bridge per gesture frame, no RN-thread re-renders.
 * Opacity fades in/out on press via a single Reanimated SharedValue.
 *
 * Returns Skia elements; must be a child of a `<Canvas>`.
 */
export const YAxisLabels: FC<Props> = ({ isActive, ticks, font, color }) => {
  const opacity = useSharedValue(0)
  useAnimatedReaction(
    () => isActive.value,
    active => {
      opacity.value = withTiming(active ? PEAK_OPACITY : 0, {
        duration: DURATIONS.labelsFade
      })
    }
  )

  // Pre-format strings + baselines so we don't recompute during animation.
  const items = useMemo(
    () =>
      ticks.map(t => ({
        text: formatLabel(t.price),
        // Skia positions text by baseline (y at glyph baseline). To place
        // the visual bottom of the glyph ~6px above the gridline, set the
        // baseline at gridline_y - 6. The font's descent (~2-3px) pushes
        // the rendered glyph bottom slightly below that baseline.
        y: Math.max(0, t.y - LABEL_GAP_ABOVE_LINE)
      })),
    [ticks]
  )

  if (!font) return null

  return (
    <Group opacity={opacity}>
      {items.map((item, i) => (
        <SkText
          key={i}
          x={LABEL_LEFT}
          y={item.y}
          text={item.text}
          font={font}
          color={color}
        />
      ))}
    </Group>
  )
}
