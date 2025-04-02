import React from 'react'
import Svg, { Line } from 'react-native-svg'
import Animated, {
  DerivedValue,
  SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { View } from '../../Primitives'
import { useTheme } from '../../../hooks'
import { alpha } from '../../../utils'
import { SELECTION_INDICATOR_LINE_WIDTH } from './SelectionIndicator'

export const DashedLine = ({
  label,
  x,
  index,
  selectedIndex,
  isInteracting,
  gridWidth,
  type
}: {
  label: string
  x: number
  index: number
  selectedIndex: DerivedValue<number | undefined>
  isInteracting: SharedValue<boolean>
  gridWidth: number
  type: 'first' | 'last' | 'middle'
}): JSX.Element => {
  const { theme } = useTheme()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      color:
        selectedIndex.value === index
          ? theme.colors.$textPrimary
          : theme.colors.$textSecondary
    }
  })

  const selectionOverlayStyle = useAnimatedStyle(() => {
    const shouldShow =
      isInteracting.value &&
      selectedIndex.value !== undefined &&
      Math.round(selectedIndex.value) === index

    return {
      opacity: withTiming(shouldShow ? 1 : 0, { duration: 300 })
    }
  })

  const selectionBackgroundPadding = 10

  return (
    <View
      sx={{
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: x
      }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width:
              type === 'middle'
                ? gridWidth
                : gridWidth / 2 + selectionBackgroundPadding,
            top: 3,
            bottom: 28,
            left:
              type === 'middle'
                ? -gridWidth / 2 + SELECTION_INDICATOR_LINE_WIDTH / 2
                : type === 'first'
                ? -selectionBackgroundPadding
                : -gridWidth / 2 + SELECTION_INDICATOR_LINE_WIDTH / 2,
            backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
            borderRadius: 12
          },
          selectionOverlayStyle
        ]}
      />
      <Svg style={{ flex: 1, width: 2, marginBottom: 25 }}>
        <Line
          x1="1"
          y1="100%"
          x2="1"
          y2="0"
          stroke={theme.colors.$borderPrimary}
          strokeWidth="2"
          strokeDasharray="0.3,4"
          strokeLinecap="round"
        />
      </Svg>
      <View
        sx={{
          position: 'absolute',
          left: -100,
          right: -100,
          bottom: 0,
          alignItems: 'center'
        }}>
        <Animated.Text
          style={[
            {
              fontFamily: 'Inter-Regular',
              fontSize: 11,
              lineHeight: 14
            },
            animatedStyle
          ]}>
          {label}
        </Animated.Text>
      </View>
    </View>
  )
}
