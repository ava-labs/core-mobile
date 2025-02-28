import React, { FC } from 'react'
import { GraphPoint, LineGraph } from 'react-native-graph'
import { useTheme } from '@avalabs/k2-alpine'
import { ViewStyle } from 'react-native'
import { alpha } from '@avalabs/k2-mobile'
import { SelectionDot } from './SelectionDot'

const SparklineChart: FC<Props> = ({
  style,
  data,
  lineThickness = 3,
  negative = false,
  verticalPadding,
  onPointSelected,
  onGestureStart,
  onGestureEnd
}) => {
  const { theme } = useTheme()

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

  return (
    <LineGraph
      style={style}
      verticalPadding={verticalPadding}
      testID="line_graph"
      animated={true}
      color={color}
      lineThickness={lineThickness}
      points={data}
      gradientFillColors={gradientFillColors}
      enablePanGesture={true}
      SelectionDot={SelectionDot}
      onPointSelected={onPointSelected}
      onGestureStart={onGestureStart}
      onGestureEnd={onGestureEnd}
    />
  )
}

interface Props {
  style?: ViewStyle
  data: { date: Date; value: number }[]
  lineThickness?: number
  negative?: boolean
  onPointSelected?: (p: GraphPoint) => void
  onGestureStart?: () => void
  onGestureEnd?: () => void
  verticalPadding?: number
}

export default SparklineChart
