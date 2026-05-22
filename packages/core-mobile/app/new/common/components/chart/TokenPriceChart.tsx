import {
  CHART_RANGES,
  ChartHeader,
  ChartRange,
  Icons,
  OhlcCandle,
  PriceChart,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useTokenChartCandles } from 'common/hooks/useTokenChartCandles'
import { useMarketToken } from 'common/hooks/useMarketToken'
import { useTokenPriceDisplay } from 'common/hooks/useTokenPriceDisplay'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Pressable } from 'react-native'
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useDispatch, useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { selectChartType, setChartType } from 'store/chartPreferences/slice'
import { selectSelectedCurrency } from 'store/settings/currency'
import { MarketToken } from 'store/watchlist'

type Props = {
  token?: LocalTokenWithBalance | undefined
  /** Takes precedence over `token` and skips the `useMarketToken` lookup. */
  marketToken?: MarketToken | undefined
  width: number
  height?: number
  /** Ignored when `range` is provided (controlled mode). */
  initialRange?: ChartRange
  range?: ChartRange
  onRangeChange?: (range: ChartRange) => void
  onPriceHeaderPress?: () => void
  /** Skip the built-in `ChartHeader` when the parent renders its own. The
   * external SharedValues below stay populated regardless. */
  hideHeader?: boolean
  externalIsActive?: SharedValue<boolean>
  externalActiveIndex?: SharedValue<number | null>
  externalCrosshairX?: SharedValue<number>
  /** Resolves the active candle from the chart's own (bucketed) `candles`,
   * so the consumer doesn't index into the wrong array. Fires on the JS
   * thread; `null` when the crosshair deactivates. */
  onActiveCandleChange?: (candle: OhlcCandle | null) => void
}

const TOGGLE_SIZE = 36
const RANGE_ITEMS = CHART_RANGES.map(range => ({ title: range }))

const ChartTypeToggle: FC = memo(() => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const chartType = useSelector(selectChartType)
  const isCandle = chartType === 'candlestick'
  const onPress = (): void => {
    dispatch(setChartType(isCandle ? 'line' : 'candlestick'))
  }
  const bg = isCandle
    ? theme.colors.$textPrimary
    : theme.colors.$surfaceSecondary
  const fg = isCandle ? theme.colors.$surfacePrimary : theme.colors.$textPrimary

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch chart to ${
        isCandle ? 'line' : 'candlestick'
      } view`}
      onPress={onPress}
      style={{
        width: TOGGLE_SIZE,
        height: TOGGLE_SIZE,
        borderRadius: TOGGLE_SIZE / 2,
        backgroundColor: bg,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Icons.Custom.Candlestick color={fg} width={24} height={24} />
    </Pressable>
  )
})

const ChartRangeSelector: FC<{
  value: ChartRange
  onChange: (range: ChartRange) => void
}> = memo(({ value, onChange }) => {
  const { theme } = useTheme()
  const selectedSegmentIndex = useSharedValue(
    Math.max(0, CHART_RANGES.indexOf(value))
  )

  useEffect(() => {
    const index = CHART_RANGES.indexOf(value)
    if (index !== -1) selectedSegmentIndex.value = index
  }, [value, selectedSegmentIndex])

  const handleSelectSegment = useCallback(
    (index: number) => {
      const next = CHART_RANGES[index]
      if (next) onChange(next)
    },
    [onChange]
  )

  return (
    <SegmentedControl
      dynamicItemWidth={false}
      items={RANGE_ITEMS}
      type="thin"
      backgroundColor={theme.colors.$surfaceSecondary}
      selectedSegmentIndex={selectedSegmentIndex}
      onSelectSegment={handleSelectSegment}
    />
  )
})

const useControlledRange = (
  initialRange: ChartRange,
  rangeProp: ChartRange | undefined,
  onRangeChange?: (range: ChartRange) => void
): [ChartRange, (next: ChartRange) => void] => {
  const [internal, setInternal] = useState<ChartRange>(initialRange)
  const isControlled = rangeProp !== undefined
  const value = isControlled ? rangeProp : internal
  const setValue = useCallback(
    (next: ChartRange) => {
      if (!isControlled) setInternal(next)
      onRangeChange?.(next)
    },
    [isControlled, onRangeChange]
  )
  return [value, setValue]
}

export const TokenPriceChart: FC<Props> = ({
  token,
  marketToken: marketTokenProp,
  width,
  height = 235,
  initialRange = '1D',
  range: rangeProp,
  onRangeChange,
  onPriceHeaderPress,
  hideHeader = false,
  externalIsActive,
  externalActiveIndex,
  externalCrosshairX,
  onActiveCandleChange
}) => {
  const chartType = useSelector(selectChartType)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const currency = selectedCurrency.toLowerCase() as VsCurrencyType
  const { formatCurrency, formatTokenInCurrency } = useFormatCurrency()
  const formatPrice = useMemo(
    () => (amount: number) =>
      formatTokenInCurrency({
        amount: Number.isFinite(amount) ? amount : 0
      }),
    [formatTokenInCurrency]
  )
  const formatVolume = useMemo(
    () => (volume: number) =>
      `Vol. ${formatCurrency({
        amount: Number.isFinite(volume) ? volume : 0,
        notation: 'compact'
      })}`,
    [formatCurrency]
  )

  const [range, handleRangeChange] = useControlledRange(
    initialRange,
    rangeProp,
    onRangeChange
  )

  const resolvedMarketToken = useMarketToken({
    token: marketTokenProp ? undefined : token
  })
  const marketToken = marketTokenProp ?? resolvedMarketToken
  const coingeckoId = marketToken?.coingeckoId ?? undefined
  const symbol = marketTokenProp?.symbol ?? token?.symbol ?? ''

  // Only the live price is computed here; `ChartHeader` derives the delta
  // range-relative from its candles so it updates per range switch.
  const { formattedPrice } = useTokenPriceDisplay({
    currentPrice: token?.priceInCurrency ?? marketToken?.currentPrice,
    priceChange24h: token?.priceChanges?.value ?? marketToken?.priceChange24h,
    priceChangePercentage24h:
      token?.priceChanges?.percentage ??
      token?.change24 ??
      marketToken?.priceChangePercentage24h
  })

  const { candles, state, isFetching } = useTokenChartCandles({
    coingeckoId,
    range,
    currency
  })

  // Cold-start window: watchlist hasn't resolved the coingeckoId yet, so the
  // chart hook returns "empty". Show the spinner instead of the "No data"
  // placeholder until the watchlist settles.
  const { isLoadingTopTokens, isLoadingTrendingTokens } = useWatchlist()
  const effectiveState =
    !coingeckoId && (isLoadingTopTokens || isLoadingTrendingTokens)
      ? ('loading' as const)
      : state

  const internalIsActive = useSharedValue(false)
  const internalActiveIndex = useSharedValue<number | null>(null)
  const internalCrosshairX = useSharedValue(0)
  const isActive = externalIsActive ?? internalIsActive
  const activeIndex = externalActiveIndex ?? internalActiveIndex
  const crosshairX = externalCrosshairX ?? internalCrosshairX
  const handleActiveIndex = useCallback(
    (idx: number | null) => {
      if (!onActiveCandleChange) return
      if (idx === null) {
        onActiveCandleChange(null)
        return
      }
      const candle = candles[idx]
      onActiveCandleChange(candle ?? null)
    },
    [candles, onActiveCandleChange]
  )
  const hasActiveCandleListener = onActiveCandleChange !== undefined
  useAnimatedReaction(
    () => activeIndex.value,
    (idx, prev) => {
      // Skip the UI→JS hop when no one is listening.
      if (!hasActiveCandleListener || idx === prev) return
      scheduleOnRN(handleActiveIndex, idx)
    },
    [hasActiveCandleListener, handleActiveIndex]
  )

  return (
    <View style={{ paddingBottom: 18, gap: 12 }}>
      {!hideHeader && (
        <ChartHeader
          candles={candles}
          symbol={symbol}
          activeIndex={activeIndex}
          crosshairX={crosshairX}
          isActive={isActive}
          containerWidth={width}
          onPriceHeaderPress={onPriceHeaderPress}
          formatPrice={formatPrice}
          isLoading={effectiveState === 'loading'}
          priceText={
            formattedPrice === UNKNOWN_AMOUNT ? undefined : formattedPrice
          }
        />
      )}
      <PriceChart
        candles={candles}
        width={width}
        height={height}
        mode={chartType}
        state={effectiveState}
        isFetching={isFetching}
        externalIsActive={isActive}
        externalActiveIndex={activeIndex}
        externalCrosshairX={crosshairX}
        formatPrice={formatPrice}
        formatVolume={formatVolume}
      />
      <View
        sx={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          alignItems: 'center'
        }}>
        <View sx={{ flex: 1 }}>
          <ChartRangeSelector value={range} onChange={handleRangeChange} />
        </View>
        <ChartTypeToggle />
      </View>
    </View>
  )
}
