import React, { FC } from 'react'
import { ViewStyle } from 'react-native'
import { Slider as RNSlider } from 'react-native-awesome-slider'
import Svg, { Circle } from 'react-native-svg'
import { SharedValue } from 'react-native-reanimated'
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
        theme={{
          minimumTrackTintColor: '#3AC489',
          maximumTrackTintColor: alpha(colors.$textPrimary, 0.2)
        }}
        progress={value}
        onValueChange={newValue => onValueChange?.(newValue)}
        containerStyle={{ height: 4, borderRadius: 100 }}
        thumbTouchSize={48}
        renderBubble={() => null}
        renderThumb={() => (
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
      />
      {(minimumValueLabel !== undefined || maximumValueLabel !== undefined) && (
        <View
          style={{
            marginTop: 6,
            flexDirection: 'row',
            justifyContent: 'space-between'
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
  value: SharedValue<number>
  onValueChange?: (value: number) => void
  thumbBorderColor?: string
  style?: ViewStyle
  minimumValue: SharedValue<number>
  maximumValue: SharedValue<number>
  minimumValueLabel?: string
  maximumValueLabel?: string
}
