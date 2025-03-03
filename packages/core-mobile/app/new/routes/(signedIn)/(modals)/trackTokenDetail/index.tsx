import {
  PriceChange,
  PriceChangeStatus,
  ScrollView,
  SegmentedControl,
  Text,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams } from 'expo-router'
import { TokenDetailChart } from 'features/track/components/TokenDetailChart'
import { TokenHeader } from 'features/track/components/TokenHeader'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Animated, {
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTokenDetails } from 'screens/watchlist/useTokenDetails'
import { formatLargeCurrency } from 'utils/Utils'
import { format } from 'date-fns'
import { ChartOverlay } from 'features/track/components/ChartOverlay'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { StyleSheet } from 'react-native'
import { SelectedChartDataIndicator } from 'features/track/components/SelectedChartDataIndicator'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'

const TrackTokenDetailScreen = (): JSX.Element => {
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>()
  const [isChartInteracting, setIsChartInteracting] = useState(false)
  const headerOpacity = useSharedValue(1)
  const selectedDataIndicatorOpacity = useDerivedValue(
    () => 1 - headerOpacity.value
  )
  const [selectedData, setSelectedData] = useState<{
    value: number
    date: Date
  }>()
  const { formatTokenInCurrency } = useFormatCurrency()
  const hasBeenViewedChart = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.CHART_INTERACTION)
  )
  const dispatch = useDispatch()

  const { getMarketTokenById } = useWatchlist()

  const { chartData, chartDays, ranges, changeChartDays } = useTokenDetails(
    tokenId ?? ''
  )

  const handleDataSelected = (point: { value: number; date: Date }): void => {
    setSelectedData(point)
  }

  const token = tokenId ? getMarketTokenById(tokenId) : undefined

  const handleChartGestureStart = (): void => {
    setIsChartInteracting(true)
  }

  const handleChartGestureEnd = (): void => {
    setIsChartInteracting(false)
  }

  const selectedSegmentIndex = useMemo(() => {
    return Object.keys(SEGMENT_INDEX_MAP).findIndex(
      key => SEGMENT_INDEX_MAP[Number(key)] === chartDays
    )
  }, [chartDays])

  const handleSelectSegment = useCallback(
    (index: number) => {
      changeChartDays(
        SEGMENT_INDEX_MAP[index] ?? 1 // default to 1 day if index is not found
      )
    },
    [changeChartDays]
  )

  const handleInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.CHART_INTERACTION))
  }

  useEffect(() => {
    headerOpacity.value = withTiming(isChartInteracting ? 0 : 1, {
      duration: 300
    })
  }, [isChartInteracting, headerOpacity])

  if (!tokenId || !token) {
    return <LoadingState />
  }

  const lastUpdatedDate = chartData?.[chartData.length - 1]?.date

  const priceChange: PriceChange | undefined =
    ranges.minDate === 0 && ranges.maxDate === 0
      ? undefined
      : {
          formattedPrice: formatLargeCurrency(
            formatTokenInCurrency(Math.abs(ranges.diffValue))
          ),
          status:
            ranges.diffValue < 0
              ? PriceChangeStatus.Down
              : ranges.diffValue === 0
              ? PriceChangeStatus.Neutral
              : PriceChangeStatus.Up,
          formattedPercent: `${ranges.percentChange
            .toFixed(2)
            .replace('-', '')}%`
        }

  return (
    <ScrollView>
      <View sx={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        <Animated.View style={{ opacity: headerOpacity }}>
          <TokenHeader token={token} priceChange={priceChange} />
        </Animated.View>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: 'center',
              justifyContent: 'center',
              opacity: selectedDataIndicatorOpacity
            }
          ]}>
          <SelectedChartDataIndicator
            selectedData={selectedData}
            currentPrice={chartData?.[0]?.value}
          />
        </Animated.View>
      </View>
      <View>
        <TokenDetailChart
          chartData={chartData}
          negative={ranges.diffValue < 0}
          onDataSelected={handleDataSelected}
          onGestureStart={handleChartGestureStart}
          onGestureEnd={handleChartGestureEnd}
        />
        <ChartOverlay
          chartData={chartData}
          shouldShowInstruction={!hasBeenViewedChart}
          onInstructionRead={handleInstructionRead}
        />
      </View>
      <View sx={{ paddingTop: 40, marginTop: 8 }}>
        {lastUpdatedDate && (
          <Animated.View
            style={{
              alignSelf: 'center',
              position: 'absolute',
              opacity: headerOpacity
            }}>
            <Text
              variant="caption"
              sx={{
                color: '$textSecondary'
              }}>
              Last updated:{' '}
              {format(lastUpdatedDate, 'E, MMM dd, yyyy, H:mm aa')}
            </Text>
          </Animated.View>
        )}
      </View>
      <SegmentedControl
        type="thin"
        dynamicItemWidth={false}
        items={['24H', '1W', '1M', '3M', '1Y']}
        style={{ marginHorizontal: 16 }}
        selectedSegmentIndex={selectedSegmentIndex}
        onSelectSegment={handleSelectSegment}
      />
    </ScrollView>
  )
}

const SEGMENT_INDEX_MAP: Record<number, number> = {
  0: 1, // 24H
  1: 7, // 1W
  2: 30, // 1M
  3: 90, // 3M
  4: 365 // 1Y
}

export default TrackTokenDetailScreen
