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
import { useSharedValue } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { selectChartType, setChartType } from 'store/chartPreferences/slice'
import { selectSelectedCurrency } from 'store/settings/currency'

type Props = {
  /** The held token whose price + chart to render. */
  token: LocalTokenWithBalance | undefined
  width: number
  height?: number
  initialRange?: ChartRange
  onPriceHeaderPress?: () => void
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
      onPressIn={onPress}
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
  const selectedSegmentIndex = useSharedValue(CHART_RANGES.indexOf(value))

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

export const TokenPriceChart: FC<Props> = ({
  token,
  width,
  height = 235,
  initialRange = '1D',
  onPriceHeaderPress
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

  const [range, setRange] = useState<ChartRange>(initialRange)

  const marketToken = useMarketToken({ token })
  const coingeckoId = marketToken?.coingeckoId ?? undefined
  const symbol = token?.symbol ?? ''

  const {
    formattedPrice,
    formattedPriceChange,
    formattedPercent,
    status: priceChangeStatus
  } = useTokenPriceDisplay({
    currentPrice: token?.priceInCurrency ?? marketToken?.currentPrice,
    priceChange24h: token?.priceChanges?.value ?? marketToken?.priceChange24h,
    priceChangePercentage24h:
      token?.priceChanges?.percentage ??
      token?.change24 ??
      marketToken?.priceChangePercentage24h
  })
  const headerPriceChange =
    formattedPriceChange === undefined && formattedPercent === undefined
      ? undefined
      : {
          status: priceChangeStatus,
          formattedPrice: formattedPriceChange,
          formattedPercent
        }

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

  const isActive = useSharedValue(false)
  const activeIndex = useSharedValue<number | null>(null)
  const crosshairX = useSharedValue(0)

  return (
    <View style={{ paddingBottom: 18, gap: 12 }}>
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
        priceChange={headerPriceChange}
      />
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
          <ChartRangeSelector value={range} onChange={setRange} />
        </View>
        <ChartTypeToggle />
      </View>
    </View>
  )
}
