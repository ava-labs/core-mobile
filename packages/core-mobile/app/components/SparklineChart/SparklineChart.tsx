import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { GraphPoint, LineGraph } from 'react-native-graph'
import { SelectionDot } from 'screens/watchlist/SelectionDot'
import { AxisLabel } from './AxisLabel'
import {
  NEGATIVE_GRADIENT_FILL_COLORS,
  POSITIVE_GRADIENT_FILL_COLORS,
  POSITIVE_SHADOW_COLOR,
  yToX
} from './utils'

interface Props {
  width?: number
  height?: number
  data: { date: Date; value: number }[]
  yRange?: [number, number] // y min, y max
  lineThickness?: number
  negative?: boolean
  interactive?: boolean
  onPointSelected?: (p: GraphPoint) => void
  onInteractionEnded?: () => void
}

const SparklineChart: FC<Props> = ({
  width = 100,
  height = 80,
  data,
  yRange,
  lineThickness = 2,
  negative = false,
  interactive = false,
  onPointSelected,
  onInteractionEnded
}) => {
  const theme = useApplicationContext().theme

  const gradientFillColors = negative
    ? NEGATIVE_GRADIENT_FILL_COLORS
    : POSITIVE_GRADIENT_FILL_COLORS

  const color = negative ? theme.colorError : theme.colorSuccess

  const shadowColor = negative ? theme.colorError : POSITIVE_SHADOW_COLOR

  const shouldNotRenderAxisLabel = data.length === 0 || !yRange

  const renderTopAxisLabel = (): JSX.Element | null => {
    if (shouldNotRenderAxisLabel) return null

    const value = yRange[1]
    const x = yToX(data, value, width)
    return <AxisLabel x={x} value={value} />
  }

  const renderBottomAxisLabel = (): JSX.Element | null => {
    if (shouldNotRenderAxisLabel) return null

    const value = yRange[0]
    const x = yToX(data, value, width)
    return <AxisLabel x={x} value={value} />
  }

  // TODO: re-enable haptic feedback after this is fixed
  // CP-5447: Pixel 6A phone vibrating once a minute when token chart is open
  // const onGestureStart = () => {
  //   hapticFeedback()
  // }

  const onGestureEnd = (): void => {
    // hapticFeedback()
    onInteractionEnded?.()
  }

  return interactive ? (
    <LineGraph
      style={{
        width: width,
        height: height
      }}
      animated
      color={color}
      shadowColor={shadowColor}
      lineThickness={lineThickness}
      points={data}
      gradientFillColors={gradientFillColors}
      enablePanGesture={true}
      SelectionDot={SelectionDot}
      onPointSelected={onPointSelected}
      // onGestureStart={onGestureStart}
      onGestureEnd={onGestureEnd}
      TopAxisLabel={renderTopAxisLabel}
      BottomAxisLabel={renderBottomAxisLabel}
    />
  ) : (
    <LineGraph
      style={{
        width: width,
        height: height
      }}
      animated={false}
      color={color}
      lineThickness={lineThickness}
      points={data}
      gradientFillColors={gradientFillColors}
    />
  )
}

export default SparklineChart
