import {
  ChartHeader,
  ChartRange,
  ChartRangeSelector,
  PriceChart,
  View
} from '@avalabs/k2-alpine'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useTokenChartCandles } from 'common/hooks/useTokenChartCandles'
import React, { FC, useState } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectChartType } from 'store/chartPreferences/slice'
import { selectSelectedCurrency } from 'store/settings/currency'
import { ChartTypeToggle } from './ChartTypeToggle'

type Props = {
  symbol: string
  coingeckoId: string | undefined
  width: number
  height?: number
  initialRange?: ChartRange
}

export const TokenPriceChart: FC<Props> = ({
  symbol,
  coingeckoId,
  width,
  height = 235,
  initialRange = '1D'
}) => {
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
          <ChartRangeSelector value={range} onChange={setRange} />
        </View>
        <ChartTypeToggle />
      </View>
    </View>
  )
}
