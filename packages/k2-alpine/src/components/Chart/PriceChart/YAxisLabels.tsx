import { Group, Text as SkText, type SkFont } from '@shopify/react-native-skia'
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
  ticks: YAxisTick[]
  /** Loaded via `useFont` in the parent — null until ready. */
  font: SkFont | null
  color: string
}

const LABEL_LEFT = 16
const LABEL_GAP_ABOVE_LINE = 6
const PEAK_OPACITY = 0.3

const formatLabel = (n: number): string =>
  n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`

/** Skia text — must be a child of a `<Canvas>`. */
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

  // Skia positions text by baseline; place it 6px above each gridline.
  const items = useMemo(
    () =>
      ticks.map(t => ({
        text: formatLabel(t.price),
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
