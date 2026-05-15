import { configureStore } from '@reduxjs/toolkit'
import {
  CHART_RANGES,
  ChartRange,
  Icons,
  OhlcvResponse,
  PriceChart,
  SegmentedControl,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import SparklineChart from 'features/track/components/SparklineChart'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { Provider, useDispatch, useSelector } from 'react-redux'
import {
  chartPreferencesReducer,
  setChartType
} from 'store/chartPreferences/slice'
import { ChartType } from 'store/chartPreferences/types'

const storyStore = configureStore({
  reducer: { chartPreferences: chartPreferencesReducer }
})

type StoryState = ReturnType<typeof storyStore.getState>

const selectChartTypeLocal = (state: StoryState): ChartType =>
  state.chartPreferences.chartType

const fixtures: Record<ChartRange, OhlcvResponse> = {
  '1H': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1h.json'),
  '1D': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1d.json'),
  '1W': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1w.json'),
  '1M': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1m.json'),
  '3M': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-3m.json'),
  '1Y': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1y.json')
}
const emptyFixture: OhlcvResponse = require('../../app/new/common/components/chart/__fixtures__/ohlcv-empty.json')

const STATES = ['loaded', 'loading', 'empty', 'error'] as const
type StateOpt = typeof STATES[number]

const TOGGLE_SIZE = 36
const RANGE_ITEMS = CHART_RANGES.map(range => ({ title: range }))
const STATE_ITEMS = STATES.map(s => ({ title: s }))

export default { title: 'PriceChart' }

export const All = (): JSX.Element => (
  <Provider store={storyStore}>
    <Body />
  </Provider>
)

const Body: React.FC = () => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const chartType = useSelector(selectChartTypeLocal)

  const [range, setRange] = useState<ChartRange>('1D')
  const [state, setState] = useState<StateOpt>('loaded')

  const stateSegmentIndex = useSharedValue(0)
  const rangeSegmentIndex = useSharedValue(CHART_RANGES.indexOf('1D'))

  useEffect(() => {
    const index = CHART_RANGES.indexOf(range)
    if (index !== -1) rangeSegmentIndex.value = index
  }, [range, rangeSegmentIndex])

  const handleSelectRange = useCallback((index: number) => {
    const next = CHART_RANGES[index]
    if (next) setRange(next)
  }, [])

  const handleSelectState = (index: number): void => {
    const next = STATES[index]
    if (next) setState(next)
    stateSegmentIndex.value = index
  }

  const isCandle = chartType === 'candlestick'
  const toggleBg = isCandle
    ? theme.colors.$textPrimary
    : theme.colors.$surfaceSecondary
  const toggleFg = isCandle
    ? theme.colors.$surfacePrimary
    : theme.colors.$textPrimary
  const onToggleChartType = (): void => {
    dispatch(setChartType(isCandle ? 'line' : 'candlestick'))
  }

  const fixture = state === 'empty' ? emptyFixture : fixtures[range]
  const candles = fixture.candles
  const lineData = useMemo(
    () => candles.map(c => ({ value: c.close, date: new Date(c.ts) })),
    [candles]
  )
  const needsPlaceholder =
    state === 'loading' ||
    state === 'empty' ||
    state === 'error' ||
    candles.length === 0
  const showSparkline = chartType === 'line' && !needsPlaceholder

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.$surfacePrimary }}
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View sx={{ gap: 8 }}>
          <Text variant="caption">State</Text>
          <SegmentedControl
            dynamicItemWidth={false}
            items={STATE_ITEMS}
            selectedSegmentIndex={stateSegmentIndex}
            onSelectSegment={handleSelectState}
          />
        </View>

        <View sx={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View sx={{ flex: 1 }}>
            <SegmentedControl
              dynamicItemWidth={false}
              items={RANGE_ITEMS}
              type="thin"
              selectedSegmentIndex={rangeSegmentIndex}
              onSelectSegment={handleSelectRange}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Switch chart to ${
              isCandle ? 'line' : 'candlestick'
            } view`}
            onPress={onToggleChartType}
            style={{
              width: TOGGLE_SIZE,
              height: TOGGLE_SIZE,
              borderRadius: TOGGLE_SIZE / 2,
              backgroundColor: toggleBg,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Icons.Custom.Candlestick color={toggleFg} width={24} height={24} />
          </Pressable>
        </View>

        <View sx={{ height: 235 }}>
          {showSparkline ? (
            <SparklineChart
              data={lineData}
              style={{ width: 350, height: 235 }}
              enablePanGesture
            />
          ) : (
            <PriceChart
              candles={candles}
              width={350}
              height={235}
              state={state}
              onRetry={() => setState('loaded')}
            />
          )}
        </View>

        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Tap & hold the chart to activate the crosshair, tooltip, and y-axis
          labels.
        </Text>
      </ScrollView>
    </GestureHandlerRootView>
  )
}
