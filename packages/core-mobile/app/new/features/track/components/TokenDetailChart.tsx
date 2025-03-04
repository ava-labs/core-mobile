import React from 'react'
import { View, useTheme } from '@avalabs/k2-alpine'
import Svg, { Line } from 'react-native-svg'
import { hapticFeedback } from 'utils/HapticFeedback'
import { GraphPoint } from 'react-native-graph'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import SparklineChart from './SparklineChart'
import { ChartOverlay } from './ChartOverlay'

export const TokenDetailChart = ({
  chartData,
  negative,
  onDataSelected,
  onGestureStart,
  onGestureEnd
}: {
  negative: boolean
  chartData: { date: Date; value: number }[] | undefined
  onDataSelected?: (p: GraphPoint) => void
  onGestureStart?: () => void
  onGestureEnd?: () => void
}): JSX.Element => {
  const hasBeenViewedChart = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.CHART_INTERACTION)
  )

  const dispatch = useDispatch()

  const handleGestureStart = (): void => {
    hapticFeedback()
    onGestureStart?.()
  }

  const handleGestureEnd = (): void => {
    hapticFeedback()
    onGestureEnd?.()
  }

  const handleInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.CHART_INTERACTION))
  }

  return (
    <View>
      <Grid />
      <SparklineChart
        style={{
          width: '100%',
          height: CHART_HEIGHT + VERTICAL_PADDING * 2
        }}
        data={chartData ?? []}
        verticalPadding={VERTICAL_PADDING}
        negative={negative}
        onGestureStart={handleGestureStart}
        onGestureEnd={handleGestureEnd}
        onPointSelected={onDataSelected}
      />
      <ChartOverlay
        chartData={chartData}
        shouldShowInstruction={!hasBeenViewedChart}
        onInstructionRead={handleInstructionRead}
      />
    </View>
  )
}

const Grid = (): JSX.Element => {
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
      <DashedLine />
      <DashedLine />
      <DashedLine />
      <DashedLine />
    </View>
  )
}

const DashedLine = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <Svg height="2" width="100%">
      <Line
        x1="0"
        y1="1"
        x2="100%"
        y2="1"
        stroke={theme.colors.$borderPrimary}
        strokeWidth="2"
        strokeDasharray="0.3,4"
        strokeLinecap="round"
      />
    </Svg>
  )
}

const VERTICAL_PADDING = 24
const CHART_HEIGHT = 150
