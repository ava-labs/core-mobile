import React, { FC, useState } from 'react'
import { SharedValue, useAnimatedReaction } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { Button } from '../Button/Button'
import { View } from '../Primitives'
import type { PresetButton } from './types'

type DialPresetsProps = {
  presets: PresetButton[]
  /**
   * Live progress on the dial (0..1). Driven from gestures, presets,
   * AND from the manual-input draft — so the active preset highlight
   * follows what the user is currently typing instead of lagging on
   * the parent `value` until blur.
   */
  progressSv: SharedValue<number>
  max: number
  step: number
  onPresetPress: (fraction: number) => void
  /** Prefix for each preset's `testID`. Falls back to `circular-dial`. */
  testIDPrefix?: string
}

export const DialPresets: FC<DialPresetsProps> = ({
  presets,
  progressSv,
  max,
  step,
  onPresetPress,
  testIDPrefix = 'circular-dial'
}) => {
  const [activePresetIndex, setActivePresetIndex] = useState(-1)

  // Recompute the active preset on the UI thread whenever progress
  // changes, then mirror to React state so the buttons re-render.
  useAnimatedReaction(
    () => {
      if (max <= 0) return -1
      const progress = progressSv.value
      const tolerance = step / max
      for (let i = 0; i < presets.length; i++) {
        const p = presets[i]
        if (!p) continue
        if (Math.abs(p.fraction - progress) <= tolerance) return i
      }
      return -1
    },
    (idx, prev) => {
      if (idx === prev) return
      scheduleOnRN(setActivePresetIndex, idx)
    },
    [presets, max, step]
  )

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8
      }}>
      {presets.map((preset, i) => (
        <Button
          key={`preset-${i}-${preset.label}`}
          type={activePresetIndex === i ? 'primary' : 'secondary'}
          size="small"
          onPress={() => onPresetPress(preset.fraction)}
          testID={`${testIDPrefix}-preset-${preset.label}`}>
          {preset.label}
        </Button>
      ))}
    </View>
  )
}
