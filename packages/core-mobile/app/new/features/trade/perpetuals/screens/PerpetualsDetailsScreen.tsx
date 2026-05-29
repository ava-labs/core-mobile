import {
  GroupList,
  type GroupListItem,
  Icons,
  PriceChangeStatus,
  SegmentedControl,
  SlidingButton,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { MarketChart } from '../components/MarketChart/MarketChart'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'

const DEFAULT_COIN = 'BTC'

/**
 * Time-range chips above the chart. Each maps to a TradingView resolution
 * code that gets pushed into the chart via {@link MarketChart}'s `resolution`
 * prop. (TV uses `'60'` for 1h, `'1D'` for 1d, etc.)
 */
const RANGES = [
  { label: '24H', resolution: '60' },
  { label: '1W', resolution: '240' },
  { label: '1M', resolution: '1D' },
  { label: '3M', resolution: '1D' },
  { label: '1Y', resolution: '1W' }
] as const

const RANGE_ITEMS = RANGES.map(r => ({ title: r.label }))

const DASH = '—'

const parseNum = (s: string | undefined): number | undefined => {
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const formatThousands = (n: number, fractionDigits = 2): string =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })

export const PerpetualsDetailsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedSegmentIndex = useSharedValue(0)

  const { coin: coinParam } = useLocalSearchParams<{ coin?: string }>()
  const coin = (coinParam ?? DEFAULT_COIN).toUpperCase()

  const { assetCtx, universe } = useHyperliquidMarketContext(coin)

  const handleSelectRange = useCallback(
    (index: number) => {
      selectedSegmentIndex.value = index
      setSelectedIndex(index)
    },
    [selectedSegmentIndex]
  )

  const resolution = RANGES[selectedIndex]?.resolution ?? '60'

  const chartTheme: 'light' | 'dark' = theme.isDark ? 'dark' : 'light'

  const markPx = parseNum(assetCtx?.markPx)
  const oraclePx = parseNum(assetCtx?.oraclePx)
  const prevDayPx = parseNum(assetCtx?.prevDayPx)
  const openInterestNum = parseNum(assetCtx?.openInterest)
  const fundingNum = parseNum(assetCtx?.funding)

  const changeDelta =
    markPx !== undefined && prevDayPx !== undefined
      ? markPx - prevDayPx
      : undefined

  const changePct =
    markPx !== undefined && prevDayPx !== undefined && prevDayPx !== 0
      ? ((markPx - prevDayPx) / prevDayPx) * 100
      : undefined

  const changeStatus =
    changePct === undefined
      ? PriceChangeStatus.Neutral
      : changePct > 0
      ? PriceChangeStatus.Up
      : changePct < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const changeColor =
    changeStatus === PriceChangeStatus.Up
      ? theme.colors.$textSuccess
      : changeStatus === PriceChangeStatus.Down
      ? theme.colors.$textDanger
      : theme.colors.$textPrimary

  const ChangeArrow =
    changeStatus === PriceChangeStatus.Up
      ? Icons.Custom.TrendingArrowUp
      : changeStatus === PriceChangeStatus.Down
      ? Icons.Custom.TrendingArrowDown
      : null

  // Negative funding pays longs → green. Positive funding → red. Matches the
  // Figma "Funding" row treatment (`#2CB753` for the negative example).
  const fundingColor =
    fundingNum === undefined
      ? theme.colors.$textPrimary
      : fundingNum < 0
      ? theme.colors.$textSuccess
      : fundingNum > 0
      ? theme.colors.$textDanger
      : theme.colors.$textPrimary

  const formattedPrice =
    markPx !== undefined ? formatCurrency({ amount: markPx }) : DASH
  const formattedOracle =
    oraclePx !== undefined ? formatCurrency({ amount: oraclePx }) : DASH
  const formattedMark = formattedPrice
  // Header shows just the percent ("+13.06%"). Row "24h change" shows
  // "<absolute Δ> / <percent Δ>%" per the Figma.
  const formattedChangePct =
    changePct === undefined
      ? DASH
      : `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`
  const formattedChangeRow =
    changeDelta === undefined || changePct === undefined
      ? DASH
      : `${changeDelta > 0 ? '+' : ''}${changeDelta.toFixed(2)} / ${
          changePct > 0 ? '+' : ''
        }${changePct.toFixed(2)}%`
  const formattedVolume =
    assetCtx?.dayNtlVlm !== undefined
      ? formatCurrency({ amount: assetCtx.dayNtlVlm })
      : DASH
  const formattedOpenInterest =
    openInterestNum !== undefined ? formatThousands(openInterestNum) : DASH
  // HL funding is per-hour decimal (e.g. 0.0001 = 0.01%/hr). Multiply by 100
  // for percent and use 4 decimals to match the Figma sample.
  const formattedFunding =
    fundingNum === undefined
      ? DASH
      : `${fundingNum > 0 ? '+' : ''}${(fundingNum * 100).toFixed(4)}%`
  const formattedLeverage =
    universe?.maxLeverage !== undefined ? `${universe.maxLeverage}×` : DASH

  const mutedValue = (text: string): JSX.Element => (
    <Text variant="body1" sx={{ color: '$textSecondary' }}>
      {text}
    </Text>
  )
  const coloredValue = (text: string, color: string): JSX.Element => (
    <Text variant="body1" sx={{ color }}>
      {text}
    </Text>
  )

  const stats: GroupListItem[] = [
    { title: 'Mark', value: mutedValue(formattedMark) },
    { title: 'Oracle', value: mutedValue(formattedOracle) },
    {
      title: '24h change',
      value: coloredValue(formattedChangeRow, changeColor)
    },
    { title: '24h volume', value: mutedValue(formattedVolume) },
    { title: 'Open interest', value: mutedValue(formattedOpenInterest) },
    { title: 'Funding', value: coloredValue(formattedFunding, fundingColor) }
  ]

  const handleDepositPress = useCallback(() => {
    // TODO: real deposit flow. Stubbed until Deposit/Withdraw is in scope.
  }, [])

  const renderFooter = useCallback(
    () => (
      <SlidingButton
        mode="single"
        label="Slide to confirm"
        onConfirm={handleDepositPress}
      />
    ),
    [handleDepositPress]
  )

  return (
    <ScrollScreen navigationTitle={coin} renderFooter={renderFooter}>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingHorizontal: 16
        }}>
        <View sx={{ gap: 4 }}>
          <Text variant="heading2" sx={{ color: '$textSecondary' }}>
            {coin}
          </Text>
          <Text variant="heading2">{formattedPrice}</Text>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {ChangeArrow ? (
              <ChangeArrow width={12} height={12} color={changeColor} />
            ) : null}
            <Text variant="subtitle1" sx={{ color: changeColor }}>
              {formattedChangePct}
            </Text>
          </View>
        </View>

        <View
          sx={{
            borderWidth: 2,
            borderColor: theme.colors.$textSecondary,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignItems: 'center'
          }}>
          <Text variant="heading2" sx={{ color: '$textSecondary' }}>
            {formattedLeverage}
          </Text>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Leverage up to
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View sx={{ height: 240, marginTop: 16 }}>
        <MarketChart
          coin={coin}
          theme={chartTheme}
          surfaceColor={theme.colors.$surfacePrimary}
          resolution={resolution}
        />
      </View>

      <SegmentedControl
        items={RANGE_ITEMS}
        selectedSegmentIndex={selectedSegmentIndex}
        onSelectSegment={handleSelectRange}
        dynamicItemWidth={false}
        type="thin"
        style={{ marginHorizontal: 16, marginTop: 12 }}
      />

      <View sx={{ marginTop: 16, marginHorizontal: 16 }}>
        <GroupList data={stats} />
      </View>
    </ScrollScreen>
  )
}
