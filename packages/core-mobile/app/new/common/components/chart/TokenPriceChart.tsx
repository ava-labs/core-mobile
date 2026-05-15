import {
  ChartHeader,
  ChartRangeSelector,
  ChartRange,
  ChartState,
  OhlcCandle,
  PriceChart,
  View
} from '@avalabs/k2-alpine'
import React, { FC, useState } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectChartType } from 'store/chartPreferences/slice'
import { ChartTypeToggle } from './ChartTypeToggle'

type Props = {
  /** Token symbol shown in the header's idle subtitle ("Current price of X"). */
  symbol: string
  /** Total chart width — usually the screen width. */
  width: number
  /** Chart canvas height (excluding the range selector / type toggle row). */
  height?: number
  /** Resolves the candles for a given range — fixture-backed today,
   * `useTokenOhlc` once CP-14267 lands. */
  getCandles: (range: ChartRange) => OhlcCandle[]
  /** Optional: loading / empty / error state per range. Defaults to 'loaded'. */
  getState?: (range: ChartRange) => ChartState
  /** Optional: called when the user taps Retry inside the error state. */
  onRetry?: (range: ChartRange) => void
  /** Initial range when the component mounts. Defaults to '1D'. */
  initialRange?: ChartRange
}

/**
 * High-level chart section: persistent price header, the chart itself, and
 * the range + chart-type controls — all wired to a single set of shared
 * values so the header text, crosshair, dot, volume highlight, and footer
 * stay in lockstep.
 *
 * Drop this into any screen with a `getCandles(range)` resolver.
 */
export const TokenPriceChart: FC<Props> = ({
  symbol,
  width,
  height = 235,
  getCandles,
  getState,
  onRetry,
  initialRange = '1D'
}) => {
  const chartType = useSelector(selectChartType)
  const [range, setRange] = useState<ChartRange>(initialRange)

  const isActive = useSharedValue(false)
  const activeIndex = useSharedValue<number | null>(null)
  const crosshairX = useSharedValue(0)

  const candles = getCandles(range)
  const state = getState?.(range) ?? 'loaded'

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
        onRetry={onRetry ? () => onRetry(range) : undefined}
        externalIsActive={isActive}
        externalActiveIndex={activeIndex}
        externalCrosshairX={crosshairX}
        hideInternalTooltip
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
