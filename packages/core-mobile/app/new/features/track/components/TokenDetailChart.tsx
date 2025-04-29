import React, { useCallback } from 'react'
import { View } from '@avalabs/k2-alpine'
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

  const handleGestureStart = useCallback((): void => {
    hapticFeedback()
    onGestureStart?.()
  }, [onGestureStart])

  const handleGestureEnd = useCallback((): void => {
    hapticFeedback()
    onGestureEnd?.()
  }, [onGestureEnd])

  const handleInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.CHART_INTERACTION))
  }

  return (
    <View>
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

const VERTICAL_PADDING = 24
const CHART_HEIGHT = 150
