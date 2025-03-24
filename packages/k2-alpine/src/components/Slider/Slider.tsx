import React, { FC } from 'react'
import { ViewStyle } from 'react-native'
import { Slider as RNSlider } from '@miblanchard/react-native-slider'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { Text, View } from '../Primitives'

export const Slider: FC<SliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  minimumValueLabel,
  maximumValueLabel,
  onValueChange,
  thumbBorderColor,
  style
}) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View style={style}>
      <RNSlider
        value={value}
        onValueChange={(values, index) =>
          values[index] && onValueChange?.(values[index])
        }
        trackStyle={{ height: 4, borderRadius: 100 }}
        thumbTouchSize={{ width: 48, height: 48 }}
        renderThumbComponent={() => (
          <Svg width={24} height={24}>
            <Circle
              cx={12}
              cy={12}
              r={12}
              fill={thumbBorderColor ?? colors.$surfaceSecondary}
            />
            <Circle cx={12} cy={12} r={8} fill={colors.$textPrimary} />
          </Svg>
        )}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        minimumTrackTintColor="#3AC489"
        maximumTrackTintColor={alpha(colors.$textPrimary, 0.2)}
      />
      {(minimumValueLabel !== undefined || maximumValueLabel !== undefined) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: -10
          }}>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            {minimumValueLabel}
          </Text>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            {maximumValueLabel}
          </Text>
        </View>
      )}
    </View>
  )
}

type SliderProps = {
  value: number
  onValueChange?: (value: number) => void
  thumbBorderColor?: string
  style?: ViewStyle
  minimumValue?: number
  maximumValue?: number
  minimumValueLabel?: string
  maximumValueLabel?: string
}
