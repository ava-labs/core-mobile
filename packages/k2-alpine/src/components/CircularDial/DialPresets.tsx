import React, { FC, useMemo } from 'react'
import { Button } from '../Button/Button'
import { View } from '../Primitives'
import { valueToProgress } from './helpers'
import type { PresetButton } from './types'

type DialPresetsProps = {
  presets: PresetButton[]
  value: number
  max: number
  step: number
  onPresetPress: (fraction: number) => void
}

export const DialPresets: FC<DialPresetsProps> = ({
  presets,
  value,
  max,
  step,
  onPresetPress
}) => {
  const activePresetIndex = useMemo(() => {
    if (max <= 0) return -1
    const progress = valueToProgress(value, max)
    const tolerance = step / max
    for (let i = 0; i < presets.length; i++) {
      const p = presets[i]
      if (!p) continue
      if (Math.abs(p.fraction - progress) <= tolerance) return i
    }
    return -1
  }, [value, max, step, presets])

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
          testID={`circular-dial-preset-${preset.label}`}>
          {preset.label}
        </Button>
      ))}
    </View>
  )
}
