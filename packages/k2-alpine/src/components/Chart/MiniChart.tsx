import React from 'react'
import { ViewStyle } from 'react-native'

import {
  Canvas,
  Circle,
  Group,
  PaintStyle,
  Path,
  Skia,
  SkPath,
  StrokeCap,
  TileMode,
  vec
} from '@shopify/react-native-skia'
import { useMemo, useState } from 'react'
import { View } from '../Primitives'
import { useTheme } from '../../hooks'
import { DataPoint, makeCurve } from '../../utils/chart'

export const MiniChart = ({
  style,
  data,
  downsampleTo = 10,
  negative = false
}: {
  style?: ViewStyle
  data: { value: number }[]
  downsampleTo?: number
  negative?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  )

  const downsampledData = useMemo(() => {
    if (downsampleTo === Number.POSITIVE_INFINITY) {
      return data
    }

    if (downsampleTo && data.length <= downsampleTo) return data

    const step = Math.floor(data.length / downsampleTo)
    return data.filter((_, index) => index % step === 0)
  }, [data, downsampleTo])

  const { path, lastPoint } = useMemo(
    () =>
      makeLineGraph({
        data: downsampledData.map((item, index) => ({
          index,
          value: item.value
        })),
        size: graphSize,
        xPadding: CIRCLE_RADIUS,
        yPadding: CIRCLE_RADIUS
      }),
    [graphSize, downsampledData]
  )

  const circleColor = negative ? NEGATIVE_COLOR_RIGHT : POSITIVE_COLOR_RIGHT

  const paint = useMemo(() => {
    const skiaColors = (
      negative ? NEGATIVE_GRADIENT_FILL_COLORS : POSITIVE_GRADIENT_FILL_COLORS
    ).map(color => Skia.Color(color))

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
    newPaint.setStrokeWidth(2.5)
    newPaint.setShader(gradientShader)

    return newPaint
  }, [graphSize, negative])

  return (
    <View
      style={[style]}
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
          <Path style="stroke" path={path} strokeWidth={2} paint={paint} />
        )}
        {lastPoint && (
          <Group>
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={CIRCLE_RADIUS}
              color={circleColor}
            />
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={CIRCLE_RADIUS - 2}
              color={theme.colors.$surfacePrimary}
            />
          </Group>
        )}
      </Canvas>
    </View>
  )
}

const CIRCLE_RADIUS = 4

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
}): {
  path: SkPath | null
  lastPoint: { x: number; y: number } | null
} => {
  const { path, lastPoint } = makeCurve({
    data,
    size,
    xPadding,
    yPadding
  })

  return {
    path: path ? Skia.Path.MakeFromSVGString(path) : null,
    lastPoint
  }
}

const NEGATIVE_COLOR_LEFT = '#EA4542'
const NEGATIVE_COLOR_RIGHT = '#F5643B'

const POSITIVE_COLOR_LEFT = '#1FC626'
const POSITIVE_COLOR_RIGHT = '#42C49F'

const NEGATIVE_GRADIENT_FILL_COLORS = [
  NEGATIVE_COLOR_LEFT,
  NEGATIVE_COLOR_RIGHT
]
const POSITIVE_GRADIENT_FILL_COLORS = [
  POSITIVE_COLOR_LEFT,
  POSITIVE_COLOR_RIGHT
]
