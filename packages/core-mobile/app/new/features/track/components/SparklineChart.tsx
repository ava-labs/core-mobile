import {
  alpha,
  ANIMATED,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { K2AlpineTheme } from '@avalabs/k2-alpine/src/theme/theme'
import { HORIZONTAL_MARGIN } from 'common/consts'
import React, { FC, useCallback } from 'react'
import { ViewStyle } from 'react-native'
import { GraphPoint, LineGraph, SelectionDotProps } from 'react-native-graph'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn
} from 'react-native-reanimated'
import Svg, { Line } from 'react-native-svg'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'
import { SelectionDot } from './SelectionDot'

const SparklineChart: FC<Props> = ({
  style,
  data,
  lineThickness = 3,
  negative = false,
  verticalPadding,
  onPointSelected,
  onGestureStart,
  onGestureEnd,
  labels,
  overrideTheme,
  enablePanGesture
}) => {
  const { theme: defaultTheme } = useTheme()
  const colorScheme = useSelector(selectSelectedColorScheme)

  const theme = overrideTheme ?? defaultTheme

  const SelectionDotWithSelector = useCallback(
    (props: SelectionDotProps) => {
      return <SelectionDot colorScheme={colorScheme} {...props} />
    },
    [colorScheme]
  )

  const NEGATIVE_GRADIENT_FILL_COLORS = [
    '#FF097F99',
    alpha(theme.colors.$surfacePrimary, 0)
  ]

  const POSITIVE_GRADIENT_FILL_COLORS = [
    '#3AC48599',
    alpha(theme.colors.$surfacePrimary, 0)
  ]

  const gradientFillColors = negative
    ? NEGATIVE_GRADIENT_FILL_COLORS
    : POSITIVE_GRADIENT_FILL_COLORS

  const color = negative ? '#FF2A6D' : '#1FA95E'

  const isTouching = useSharedValue(false)

  const handleTouchStart = useCallback(() => {
    isTouching.value = true
    onGestureStart?.()
  }, [isTouching, onGestureStart])

  const handleTouchEnd = useCallback(() => {
    isTouching.value = false
    onGestureEnd?.()
  }, [isTouching, onGestureEnd])

  return (
    <View style={style}>
      <Grid
        isTouching={isTouching}
        labels={labels}
        color={theme.colors.$borderPrimary}
        isLoading={data.length === 0}
      />
      {data?.length ? (
        <Animated.View
          entering={FadeIn.delay(400).duration(1000)}
          layout={SPRING_LINEAR_TRANSITION}>
          <LineGraph
            style={{ width: '100%', height: '100%' }}
            verticalPadding={verticalPadding}
            testID="line_graph"
            animated={true}
            color={color}
            lineThickness={lineThickness}
            points={data}
            gradientFillColors={gradientFillColors}
            enablePanGesture={enablePanGesture}
            SelectionDot={props => SelectionDotWithSelector(props)}
            onPointSelected={onPointSelected}
            onGestureStart={handleTouchStart}
            onGestureEnd={handleTouchEnd}
          />
        </Animated.View>
      ) : null}
    </View>
  )
}

interface Props {
  style?: ViewStyle
  data: { date: Date; value: number }[]
  labels?: string[]
  lineThickness?: number
  negative?: boolean
  onPointSelected?: (p: GraphPoint) => void
  onGestureStart?: () => void
  onGestureEnd?: () => void
  verticalPadding?: number
  overrideTheme?: K2AlpineTheme
  enablePanGesture?: boolean
}

const Grid = ({
  color,
  labels,
  isTouching,
  isLoading
}: {
  color: string
  labels?: string[]
  isTouching: SharedValue<boolean>
  isLoading: boolean
}): JSX.Element => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoading ? 0.2 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          gap: 44,
          zIndex: 1000,
          pointerEvents: 'none'
        }
      ]}>
      {(labels || new Array(4).fill('')).map((label, index) => (
        <DashedLine
          isTouching={isTouching}
          key={index}
          label={label}
          color={color}
        />
      ))}
    </Animated.View>
  )
}

const DashedLine = ({
  color,
  label,
  isTouching
}: {
  color: string
  label: string
  isTouching: SharedValue<boolean>
}): JSX.Element => {
  const { theme } = useTheme()

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isTouching.value ? 1 : 0, ANIMATED.TIMING_CONFIG)
    }
  })

  return (
    <View>
      <Animated.View
        style={[
          { position: 'absolute', bottom: 4, left: HORIZONTAL_MARGIN },
          labelStyle
        ]}>
        <Text
          variant="caption"
          sx={{
            fontFamily: 'Inter-Medium',
            color: alpha(theme.colors.$textPrimary, 0.3)
          }}>
          {label}
        </Text>
      </Animated.View>
      <Svg height="2" width="100%">
        <Line
          x1="0"
          y1="1"
          x2="100%"
          y2="1"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="0.3,4"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  )
}

export default SparklineChart
