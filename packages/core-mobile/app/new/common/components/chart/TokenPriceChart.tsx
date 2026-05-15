import {
  CHART_RANGES,
  ChartHeader,
  ChartRange,
  Icons,
  PriceChart,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useTokenChartCandles } from 'common/hooks/useTokenChartCandles'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { selectChartType, setChartType } from 'store/chartPreferences/slice'
import { selectSelectedCurrency } from 'store/settings/currency'

type Props = {
  symbol: string
  coingeckoId: string | undefined
  width: number
  height?: number
  initialRange?: ChartRange
}

const TOGGLE_SIZE = 36
const RANGE_ITEMS = CHART_RANGES.map(range => ({ title: range }))

export const TokenPriceChart: FC<Props> = ({
  symbol,
  coingeckoId,
  width,
  height = 235,
  initialRange = '1D'
}) => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const chartType = useSelector(selectChartType)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const currency = selectedCurrency.toLowerCase() as VsCurrencyType

  const [range, setRange] = useState<ChartRange>(initialRange)

  const { candles, state } = useTokenChartCandles({
    coingeckoId,
    range,
    currency,
    mode: chartType
  })

  const isActive = useSharedValue(false)
  const activeIndex = useSharedValue<number | null>(null)
  const crosshairX = useSharedValue(0)
  const selectedSegmentIndex = useSharedValue(
    CHART_RANGES.indexOf(initialRange)
  )

  useEffect(() => {
    const index = CHART_RANGES.indexOf(range)
    if (index !== -1) selectedSegmentIndex.value = index
  }, [range, selectedSegmentIndex])

  const handleSelectRange = useCallback((index: number) => {
    const next = CHART_RANGES[index]
    if (next) setRange(next)
  }, [])

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

  return (
    <View style={{ paddingBottom: 12, gap: 12 }}>
      <ChartHeader
        candles={candles}
        symbol={symbol}
        activeIndex={activeIndex}
        crosshairX={crosshairX}
        isActive={isActive}
        containerWidth={width}
      />
      <PriceChart
        candles={candles}
        width={width}
        height={height}
        mode={chartType}
        state={state}
        externalIsActive={isActive}
        externalActiveIndex={activeIndex}
        externalCrosshairX={crosshairX}
      />
      <View
        sx={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          alignItems: 'center'
        }}>
        <View sx={{ flex: 1 }}>
          <SegmentedControl
            dynamicItemWidth={false}
            items={RANGE_ITEMS}
            type="thin"
            selectedSegmentIndex={selectedSegmentIndex}
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
    </View>
  )
}
