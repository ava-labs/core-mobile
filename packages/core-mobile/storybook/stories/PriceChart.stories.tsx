import { configureStore } from '@reduxjs/toolkit'
import {
  ChartRange,
  ChartRangeSelector,
  OhlcCandle,
  OhlcvResponse,
  PriceChart,
  SegmentedControl,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import SparklineChart from 'features/track/components/SparklineChart'
import { useSelector } from 'react-redux'
import React, { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { Provider } from 'react-redux'
import { chartPreferencesReducer } from 'store/chartPreferences/slice'
import { ChartType } from 'store/chartPreferences/types'
import { ChartTypeToggle } from 'common/components/chart/ChartTypeToggle'

// ---------------------------------------------------------------------------
// Local mini-store for Storybook isolation (no encrypted-store dependency).
// ---------------------------------------------------------------------------
const storyStore = configureStore({
  reducer: { chartPreferences: chartPreferencesReducer }
})

type StoryState = ReturnType<typeof storyStore.getState>

// Type-safe local selector: the mini-store only has the chartPreferences slice.
const selectChartTypeLocal = (state: StoryState): ChartType =>
  state.chartPreferences.chartType

// ---------------------------------------------------------------------------
// Fixture data (pre-generated JSON files created in Task 5).
// ---------------------------------------------------------------------------
const fixtures: Record<ChartRange, OhlcvResponse> = {
  '1H': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1h.json'),
  '1D': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1d.json'),
  '1W': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1w.json'),
  '1M': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1m.json'),
  '3M': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-3m.json'),
  '1Y': require('../../app/new/common/components/chart/__fixtures__/ohlcv-avax-1y.json')
}
const emptyFixture: OhlcvResponse = require('../../app/new/common/components/chart/__fixtures__/ohlcv-empty.json')

// ---------------------------------------------------------------------------
// Story state options.
// ---------------------------------------------------------------------------
const STATES = ['loaded', 'loading', 'empty', 'error'] as const
type StateOpt = typeof STATES[number]

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
export default { title: 'PriceChart' }

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------
export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [range, setRange] = useState<ChartRange>('1D')
  const [state, setState] = useState<StateOpt>('loaded')
  const stateSegmentIndex = useSharedValue(0)
  const fixture = state === 'empty' ? emptyFixture : fixtures[range]

  return (
    <Provider store={storyStore}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.colors.$surfacePrimary }}
          contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* State selector */}
          <View sx={{ gap: 8 }}>
            <Text variant="caption">State</Text>
            <SegmentedControl
              dynamicItemWidth={false}
              items={STATES.map(s => ({ title: s }))}
              selectedSegmentIndex={stateSegmentIndex}
              onSelectSegment={(i: number) => {
                const next = STATES[i]
                if (next) setState(next)
                stateSegmentIndex.value = i
              }}
            />
          </View>

          {/* Range + chart-type toggle */}
          <View sx={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View sx={{ flex: 1 }}>
              <ChartRangeSelector value={range} onChange={setRange} />
            </View>
            <ChartTypeToggle />
          </View>

          {/* Chart area */}
          <View sx={{ height: 235 }}>
            <ChartArea
              candles={fixture.candles}
              width={350}
              height={235}
              chartState={state}
              onRetry={() => setState('loaded')}
            />
          </View>

          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Tap & hold the chart to activate the crosshair, tooltip, and y-axis
            labels.
          </Text>
        </ScrollView>
      </GestureHandlerRootView>
    </Provider>
  )
}

// ---------------------------------------------------------------------------
// Internal ChartArea — must live inside <Provider> to read Redux state.
// All hooks are called unconditionally (rules of hooks satisfied).
// ---------------------------------------------------------------------------
type ChartAreaProps = {
  candles: OhlcCandle[]
  width: number
  height: number
  chartState: StateOpt
  onRetry: () => void
}

const ChartArea: React.FC<ChartAreaProps> = ({
  candles,
  width,
  height,
  chartState,
  onRetry
}) => {
  // Always call useMemo unconditionally (rules of hooks).
  const lineData = useMemo(
    () =>
      candles.map(c => ({
        value: c.close,
        date: new Date(c.ts)
      })),
    [candles]
  )

  // Read chart type from the local mini-store.
  const chartType = useSelector(selectChartTypeLocal)

  // For loading / empty / error states delegate to PriceChart which
  // already implements all placeholder branches (Tasks 12-13). This keeps the
  // story DRY and ensures both chart types share the same placeholder UX.
  const needsPlaceholder =
    chartState === 'loading' ||
    chartState === 'empty' ||
    chartState === 'error' ||
    candles.length === 0

  if (chartType === 'candlestick' || needsPlaceholder) {
    return (
      <PriceChart
        candles={candles}
        width={width}
        height={height}
        state={chartState}
        onRetry={onRetry}
      />
    )
  }

  // Line chart — only reached when chartType === 'line' && loaded && data present.
  return (
    <SparklineChart
      data={lineData}
      style={{ width, height }}
      enablePanGesture
    />
  )
}
