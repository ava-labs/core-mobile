import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Svg, { Circle, Line } from 'react-native-svg'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'

export const SelectionIndicator = ({
  x,
  y
}: {
  x: SharedValue<number | undefined>
  y: SharedValue<number>
}): JSX.Element => {
  const { theme } = useTheme()
  const inset = SELECTION_INDICATOR_LINE_WIDTH / 2
  const [layout, setLayout] = useState<{ width: number; height: number }>()
  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (x.value === undefined)
      return { opacity: withTiming(0, { duration: 300 }) }

    return { left: x.value, opacity: withTiming(1, { duration: 300 }) }
  })
  const dotAnimatedStyle = useAnimatedStyle(() => ({
    top:
      y.value -
      (SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH)
  }))

  return (
    <Animated.View
      style={[
        {
          width: SELECTION_INDICATOR_LINE_WIDTH,
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          bottom: 25
        },
        animatedStyle
      ]}
      onLayout={handleLayout}>
      <Svg style={{ flex: 1, width: SELECTION_INDICATOR_LINE_WIDTH }}>
        <Line
          x1={inset}
          y1={(layout?.height ?? 0) - inset}
          x2={inset}
          y2={inset}
          stroke={theme.colors.$textPrimary}
          strokeWidth={SELECTION_INDICATOR_LINE_WIDTH}
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width:
              (SELECTION_INDICATOR_CIRCLE_RADIUS +
                SELECTION_INDICATOR_LINE_WIDTH) *
              2,
            height:
              (SELECTION_INDICATOR_CIRCLE_RADIUS +
                SELECTION_INDICATOR_LINE_WIDTH) *
              2
          },
          dotAnimatedStyle
        ]}>
        <Svg>
          <Circle
            cx={
              SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH
            }
            cy={
              SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH
            }
            r={SELECTION_INDICATOR_CIRCLE_RADIUS}
            strokeWidth={SELECTION_INDICATOR_LINE_WIDTH}
            fill={theme.colors.$surfacePrimary}
            stroke={theme.colors.$textPrimary}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  )
}

export const SELECTION_INDICATOR_LINE_WIDTH = 3
const SELECTION_INDICATOR_CIRCLE_RADIUS = 8
