import React, { FC, useCallback } from 'react'
import { GraphPoint, LineGraph, SelectionDotProps } from 'react-native-graph'
import { useTheme, View } from '@avalabs/k2-alpine'
import { ViewStyle } from 'react-native'
import { alpha } from '@avalabs/k2-mobile'
import Svg, { Line } from 'react-native-svg'
import { K2AlpineTheme } from '@avalabs/k2-alpine/src/theme/theme'
import { selectSelectedColorScheme } from 'store/settings/appearance'
import { useSelector } from 'react-redux'
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
  overrideTheme
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

  return (
    <View style={style}>
      <Grid color={theme.colors.$borderPrimary} />
      <LineGraph
        style={{ width: '100%', height: '100%' }}
        verticalPadding={verticalPadding}
        testID="line_graph"
        animated={true}
        color={color}
        lineThickness={lineThickness}
        points={data}
        gradientFillColors={gradientFillColors}
        enablePanGesture={true}
        SelectionDot={props => SelectionDotWithSelector(props)}
        onPointSelected={onPointSelected}
        onGestureStart={onGestureStart}
        onGestureEnd={onGestureEnd}
      />
    </View>
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
  overrideTheme?: K2AlpineTheme
}

const Grid = ({ color }: { color: string }): JSX.Element => {
  return (
    <View
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        gap: 44
      }}>
      <DashedLine color={color} />
      <DashedLine color={color} />
      <DashedLine color={color} />
      <DashedLine color={color} />
    </View>
  )
}

const DashedLine = ({ color }: { color: string }): JSX.Element => {
  return (
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
  )
}

export default SparklineChart
