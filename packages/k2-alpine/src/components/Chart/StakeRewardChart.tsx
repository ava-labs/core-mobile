import React from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'

import {
  Canvas,
  PaintStyle,
  Path,
  Skia,
  SkPath,
  StrokeCap,
  TileMode,
  vec
} from '@shopify/react-native-skia'
import { useMemo, useState } from 'react'
import { curveBundle, line, scaleLinear } from 'd3'
import Svg, { Circle, Line } from 'react-native-svg'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { svgPathProperties } from 'svg-path-properties'
import { Text, View } from '../Primitives'
import { useTheme } from '../../hooks'

export const StakeRewardChart = ({
  style,
  data
}: {
  style?: ViewStyle
  data: { value: number; duration: string }[]
}): JSX.Element => {
  const { theme } = useTheme()
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  )

  const path = useMemo(
    () =>
      makeLineGraph({
        data: data.map((item, index) => ({
          index,
          value: item.value
        })),
        size: graphSize,
        xPadding: GRAPH_STROKE_WIDTH,
        yPadding: GRAPH_STROKE_WIDTH
      }),
    [graphSize, data]
  )

  const paint = useMemo(() => {
    const skiaColors = POSITIVE_GRADIENT_FILL_COLORS.map(color =>
      Skia.Color(color)
    )

    const gradientShader = Skia.Shader.MakeLinearGradient(
      vec(0, 0),
      vec(graphSize.width, graphSize.height),
      skiaColors,
      null,
      TileMode.Clamp
    )

    const newPaint = Skia.Paint()
    newPaint.setStyle(PaintStyle.Stroke)
    newPaint.setStrokeCap(StrokeCap.Round)
    newPaint.setStrokeWidth(GRAPH_STROKE_WIDTH)
    newPaint.setShader(gradientShader)

    return newPaint
  }, [graphSize])

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.$surfaceSecondary,
          borderRadius: 12,
          paddingBottom: 15
        },
        style
      ]}>
      <View sx={{ flexGrow: 1 }}>
        <View sx={{ alignItems: 'center', paddingTop: 11, paddingBottom: 8 }}>
          <Text variant="heading6">AVAX</Text>
          <Text variant="caption">USD</Text>
        </View>
        <View sx={{ flex: 1 }}>
          <View
            sx={{
              flex: 1,
              marginBottom: 36,
              marginHorizontal: 36
            }}
            onLayout={({ nativeEvent: { layout } }) => {
              setGraphSize({
                width: layout.width,
                height: layout.height
              })
            }}>
            <Canvas
              style={{
                width: graphSize.width,
                height: graphSize.height
              }}>
              {path && (
                <Path
                  style="stroke"
                  path={path}
                  strokeWidth={GRAPH_STROKE_WIDTH}
                  paint={paint}
                />
              )}
            </Canvas>
          </View>
          <Grid data={data} graphSize={graphSize} />
        </View>
      </View>
    </View>
  )
}

const Grid = ({
  data,
  graphSize
}: {
  data: { value: number; duration: string }[]
  graphSize: { width: number; height: number }
}): JSX.Element => {
  const [layout, setLayout] = useState<{ width: number; height: number }>()

  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }
  const selectionX = useSharedValue(0)
  const selectionY = useSharedValue(0)

  const updateSelectionY = (xVal: number): void => {
    const dataPoints = data.map((item, index) => ({ index, value: item.value }))
    selectionY.value = getYFromXUsingSvgPathProperties(
      xVal,
      dataPoints,
      graphSize,
      GRAPH_STROKE_WIDTH,
      GRAPH_STROKE_WIDTH
    )
  }

  const panGesture = Gesture.Pan().onUpdate(event => {
    const x = Math.min(Math.max(event.x, 0), layout?.width ?? 0)
    selectionX.value = x
    runOnJS(updateSelectionY)(x)
  })

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
        <Animated.View
          style={{
            flex: 1,
            marginHorizontal: 36,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
          onLayout={handleLayout}>
          {data.map((item, index) => (
            <DashedLine key={index} label={item.duration} />
          ))}
          <SelectionIndicator x={selectionX} y={selectionY} />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const DashedLine = ({ label }: { label: string }): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={{ alignItems: 'center' }}>
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
        <Text
          variant="caption"
          sx={{
            color: '$textSecondary'
          }}>
          {label}
        </Text>
      </View>
    </View>
  )
}

export const SelectionIndicator = ({
  x,
  y
}: {
  x: SharedValue<number>
  y: SharedValue<number>
}): JSX.Element => {
  const { theme } = useTheme()
  const inset = SELECTION_INDICATOR_LINE_WIDTH / 2

  const [layout, setLayout] = useState<{ width: number; height: number }>()

  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value
  }))

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    top:
      y.value -
      (SELECTION_INDICATOR_CIRCLE_RADIUS + SELECTION_INDICATOR_LINE_WIDTH)
  }))

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          bottom: 25
        },
        animatedStyle
      ]}
      onLayout={handleLayout}>
      <Svg
        style={{
          flex: 1,
          width: SELECTION_INDICATOR_LINE_WIDTH
        }}>
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
            fill="white"
            stroke={theme.colors.$textPrimary}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  )
}

const makeLineGraph = ({
  data,
  size,
  xPadding = 0,
  yPadding = 0
}: {
  data: DataPoint[]
  size: { width: number; height: number }
  xPadding?: number
  yPadding?: number
}): SkPath | null => {
  const curvedLine = getCurvedLineSVGString({ data, size, xPadding, yPadding })

  return curvedLine ? Skia.Path.MakeFromSVGString(curvedLine) : null
}

const getYFromXUsingSvgPathProperties = (
  xCoord: number,
  data: DataPoint[],
  size: { width: number; height: number },
  xPadding = 0,
  yPadding = 0
): number => {
  const curvedLine = getCurvedLineSVGString({ data, size, xPadding, yPadding })

  if (!curvedLine) {
    return 0
  }

  // 유효 영역의 너비 (좌우 패딩 제거)
  const effectiveWidth = size.width - 2 * xPadding
  // x 좌표를 유효 영역 내로 클램프
  const clampedX = Math.max(xPadding, Math.min(xCoord, size.width - xPadding))
  // 유효 영역 내에서의 비율 (0 ~ 1)
  const fraction = (clampedX - xPadding) / effectiveWidth

  // svg-path-properties를 사용해 path의 속성을 얻음
  const properties = new svgPathProperties(curvedLine)
  const totalLength = properties.getTotalLength()
  // 전체 길이에서 해당 비율의 거리를 계산
  const distance = fraction * totalLength
  // 해당 길이에 해당하는 점을 구함
  const point = properties.getPointAtLength(distance)

  console.log(point, size)
  return point.y
}

const getCurvedLineSVGString = ({
  data,
  size,
  xPadding = 0,
  yPadding = 0
}: {
  data: DataPoint[]
  size: { width: number; height: number }
  xPadding?: number
  yPadding?: number
}): string | null => {
  const max = Math.max(...data.map(val => val.value))
  const min = Math.min(...data.map(val => val.value))

  const x = scaleLinear()
    .domain([0, data.length - 1])
    .range([xPadding, size.width - xPadding])

  const y = scaleLinear()
    .domain([min, max])
    .range([size.height - yPadding, yPadding])

  return line<DataPoint>()
    .x(d => x(d.index))
    .y(d => y(d.value))
    .curve(curveBundle)(data)
}

type DataPoint = {
  index: number
  value: number
}

const POSITIVE_COLOR_LEFT = '#1FC626'
const POSITIVE_COLOR_RIGHT = '#42C49F'

const POSITIVE_GRADIENT_FILL_COLORS = [
  POSITIVE_COLOR_LEFT,
  POSITIVE_COLOR_RIGHT
]

const SELECTION_INDICATOR_LINE_WIDTH = 3
const SELECTION_INDICATOR_CIRCLE_RADIUS = 8

const GRAPH_STROKE_WIDTH = 3
