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
  /** Held token to render (Portfolio path). Resolves marketToken via
   * `useMarketToken`. Ignored when `marketToken` is provided. */
  token?: LocalTokenWithBalance | undefined
  /** Directly-supplied watchlist token (Track path). Takes precedence over
   * `token` — callers that already have one can avoid the extra lookup. */
  marketToken?: MarketToken | undefined
  width: number
  height?: number
  /** Initial range when range is uncontrolled. Ignored if `range` is set. */
  initialRange?: ChartRange
  /** Controlled range value. Pair with `onRangeChange`. */
  range?: ChartRange
  onRangeChange?: (range: ChartRange) => void
  onPriceHeaderPress?: () => void
  /** Skip rendering the built-in `ChartHeader` when the parent screen already
   * shows its own token header (e.g. Track's `TokenHeader` with the rank
   * badge). The chart's crosshair SharedValues are still exposed via the
   * `external*` props so the parent can drive its own overlay. */
  hideHeader?: boolean
  /** Crosshair state mirrored out for the parent (e.g. to fade an overlay
   * indicator). If omitted, the chart manages its own SharedValues. */
  externalIsActive?: SharedValue<boolean>
  externalActiveIndex?: SharedValue<number | null>
  externalCrosshairX?: SharedValue<number>
  /** Fires on the JS thread with the candle at the crosshair index — or
   * `null` when the crosshair deactivates. Use this instead of looking up
   * the active candle yourself, because the chart's candles are bucketed
   * by `useTokenChartCandles` and won't match the raw source data. */
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

  // Prefer the caller-supplied marketToken (Track has one directly); fall back
  // to resolving from the held token.
  const resolvedMarketToken = useMarketToken({
    token: marketTokenProp ? undefined : token
  })
  const marketToken = marketTokenProp ?? resolvedMarketToken
  const coingeckoId = marketToken?.coingeckoId ?? undefined
  const symbol = marketTokenProp?.symbol ?? token?.symbol ?? ''

  // Live current price for the big idle heading. The change indicator is
  // *not* computed here — we let `ChartHeader` derive it range-relative from
  // the candles in view so the percent + amount update whenever the user
  // switches range (matches Track's behavior).
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

  // Bridge the active-index SharedValue back to JS so the parent can show
  // an overlay with the right candle. The lookup happens on the JS thread
  // — `scheduleOnRN` serializes its args across threads, which would strip
  // the candle's structure into a POJO; passing the index keeps things
  // simple and lets the consumer's callback receive the real object.
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
  useAnimatedReaction(
    () => activeIndex.value,
    (idx, prev) => {
      if (idx === prev) return
      scheduleOnRN(handleActiveIndex, idx)
    }
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
          priceText={formattedPrice}
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
