import React, { useState } from 'react'

import { Slider, Text, Tooltip, View } from '@avalabs/k2-alpine'
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction
} from 'react-native-reanimated'

export const NodeParameterWidget = ({
  title,
  value,
  tooltipMessage,
  minimumValue,
  maximumValue
}: {
  title: string
  value: SharedValue<number>
  tooltipMessage?: string
  minimumValue: number
  maximumValue: number
}): JSX.Element => {
  const [valueState, setValueState] = useState(value.value)

  useAnimatedReaction(
    () => value.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setValueState)(
          Math.round(Math.min(Math.max(current, minimumValue), maximumValue))
        )
      }
    }
  )

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        gap: 20
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <View sx={{ gap: 2 }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="body1">{title}</Text>
            {tooltipMessage !== undefined && (
              <Tooltip title={title} description={tooltipMessage} />
            )}
          </View>
          <Text
            variant="caption"
            sx={{
              color: '$textSecondary'
            }}>{`Select a value between ${minimumValue}-${maximumValue}%`}</Text>
        </View>
        <Text variant="heading5">{valueState}%</Text>
      </View>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        minimumValueLabel={`${minimumValue}%`}
        maximumValueLabel={`${maximumValue}%`}
      />
    </View>
  )
}
