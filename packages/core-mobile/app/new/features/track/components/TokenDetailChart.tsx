import { View } from '@avalabs/k2-alpine'
import React, { useCallback, useMemo } from 'react'
import { GraphPoint } from 'react-native-graph'
import { useDispatch, useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { formatCurrency } from 'utils/FormatCurrency'
import { hapticFeedback } from 'utils/HapticFeedback'
import { ChartOverlay } from './ChartOverlay'
import SparklineChart from './SparklineChart'

export const TokenDetailChart = ({
  chartData,
  ranges,
  negative,
  onDataSelected,
  onGestureStart,
  onGestureEnd
}: {
  negative: boolean
  ranges: {
    minDate: number
    maxDate: number
    minPrice: number
    maxPrice: number
    diffValue: number
    percentChange: number
  }
  chartData: { date: Date; value: number }[] | undefined
  onDataSelected?: (p: GraphPoint) => void
  onGestureStart?: () => void
  onGestureEnd?: () => void
}): JSX.Element => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
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

  const chartLabels = useMemo(() => {
    const min = ranges.minPrice
    const max = ranges.maxPrice
    const range = max - min
    const point1 = max
    const point2 = min + (2 * range) / 3
    const point3 = min + range / 3
    const point4 = min

    return [point1, point2, point3, point4].map(value =>
      formatCurrency({
        amount: value,
        currency: selectedCurrency,
        boostSmallNumberPrecision: true,
        notation: 'engineering'
      })
    )
  }, [ranges.maxPrice, ranges.minPrice, selectedCurrency])

  return (
    <View
      style={{
        height: CHART_HEIGHT + VERTICAL_PADDING * 2
      }}>
      <SparklineChart
        style={{
          width: '100%',
          height: '100%'
        }}
        labels={chartLabels}
        data={chartData ?? []}
        verticalPadding={VERTICAL_PADDING + 4}
        negative={negative}
        onGestureStart={handleGestureStart}
        onGestureEnd={handleGestureEnd}
        onPointSelected={onDataSelected}
        enablePanGesture
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
