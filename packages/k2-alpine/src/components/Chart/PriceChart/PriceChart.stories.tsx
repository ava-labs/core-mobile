import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { Icons } from '../../../theme/tokens/Icons'
import { Text, View } from '../../Primitives'
import { SegmentedControl } from '../../SegmentedControl/SegmentedControl'
import { PriceChart } from './PriceChart'
import {
  CHART_RANGES,
  ChartRange,
  OhlcvResponse,
  PriceChartMode
} from './types'

const fixtures: Record<ChartRange, OhlcvResponse> = {
  '1H': require('./__fixtures__/ohlcv-avax-1h.json'),
  '1D': require('./__fixtures__/ohlcv-avax-1d.json'),
  '1W': require('./__fixtures__/ohlcv-avax-1w.json'),
  '1M': require('./__fixtures__/ohlcv-avax-1m.json'),
  '3M': require('./__fixtures__/ohlcv-avax-3m.json'),
  '1Y': require('./__fixtures__/ohlcv-avax-1y.json')
}
const emptyFixture: OhlcvResponse = require('./__fixtures__/ohlcv-empty.json')

const STATES = ['loaded', 'loading', 'empty', 'error'] as const
type StateOpt = typeof STATES[number]

const TOGGLE_SIZE = 36
const RANGE_ITEMS = CHART_RANGES.map(range => ({ title: range }))
const STATE_ITEMS = STATES.map(s => ({ title: s }))

export default { title: 'PriceChart' }

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [range, setRange] = useState<ChartRange>('1D')
  const [state, setState] = useState<StateOpt>('loaded')
  const [chartType, setChartTypeState] = useState<PriceChartMode>('candlestick')

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
    setChartTypeState(isCandle ? 'line' : 'candlestick')
  }

  const fixture = state === 'empty' ? emptyFixture : fixtures[range]

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
              backgroundColor={theme.colors.$surfaceSecondary}
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
          <PriceChart
            candles={fixture.candles}
            width={350}
            height={235}
            mode={chartType}
            state={state}
          />
        </View>

        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Tap & hold the chart to activate the crosshair and y-axis labels.
        </Text>
      </ScrollView>
    </GestureHandlerRootView>
  )
}
