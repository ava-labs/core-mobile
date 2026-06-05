import {
  Icons,
  SegmentedControl,
  SlidingButton,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import type { TvResolution } from '@avalabs/perps-sdk'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { MarketChart } from '../components/MarketChart'
import { MarketDetailsHeader } from '../components/MarketDetailsHeader'
import { MarketStatistics } from '../components/MarketStatistics'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'

const DEFAULT_COIN = 'BTC'

// TODO: replace with `clearinghouseState.withdrawable > 0` once the SDK's
// per-user balance lookup is wired up. The footer switches between
// `Slide to deposit` (no balance) and `Short / Long` (funded).
const HAS_BALANCE = true

const RANGES: readonly { label: string; resolution: TvResolution }[] = [
  { label: '24H', resolution: '60' },
  { label: '1W', resolution: '240' },
  { label: '1M', resolution: '1D' },
  { label: '3M', resolution: '1D' },
  { label: '1Y', resolution: '1W' }
] as const

const RANGE_ITEMS = RANGES.map(r => ({ title: r.label }))

export const PerpetualsDetailsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedSegmentIndex = useSharedValue(0)

  const { coin: coinParam } = useLocalSearchParams<{ coin?: string }>()
  const coin = (coinParam ?? DEFAULT_COIN).toUpperCase()

  const { assetCtx, universe, pxDecimals } = useHyperliquidMarketContext(coin)
  const pricescale =
    pxDecimals !== undefined ? Math.pow(10, pxDecimals) : undefined

  const handleSelectRange = useCallback(
    (index: number) => {
      selectedSegmentIndex.value = index
      setSelectedIndex(index)
    },
    [selectedSegmentIndex]
  )

  const resolution = RANGES[selectedIndex]?.resolution ?? '60'
  const chartTheme: 'light' | 'dark' = theme.isDark ? 'dark' : 'light'

  const handleDeposit = useCallback(() => {
    router.push('/perpetualsDeposit')
  }, [router])

  const handleShort = useCallback(() => {
    router.push(
      `/perpetualsPlaceOrder?coin=${encodeURIComponent(coin)}&side=short`
    )
  }, [coin, router])

  const handleLong = useCallback(() => {
    router.push(
      `/perpetualsPlaceOrder?coin=${encodeURIComponent(coin)}&side=long`
    )
  }, [coin, router])

  const renderFooter = useCallback(() => {
    if (!HAS_BALANCE) {
      return (
        <SlidingButton
          mode="single"
          label="Slide to deposit"
          onConfirm={handleDeposit}
        />
      )
    }

    const leftIcon = (): JSX.Element => (
      <Icons.Custom.TrendingArrowDown
        width={16}
        height={16}
        color={theme.colors.$textDanger}
      />
    )
    const rightIcon = (): JSX.Element => (
      <Icons.Custom.TrendingArrowUp
        width={16}
        height={16}
        color={theme.colors.$textSuccess}
      />
    )

    return (
      <SlidingButton
        mode="bidirectional"
        leftLabel="Short"
        rightLabel="Long"
        leftColor={theme.colors.$textDanger}
        rightColor={theme.colors.$textSuccess}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onConfirmLeft={handleShort}
        onConfirmRight={handleLong}
      />
    )
  }, [
    handleDeposit,
    handleShort,
    handleLong,
    theme.colors.$textDanger,
    theme.colors.$textSuccess
  ])

  return (
    <ScrollScreen isModal navigationTitle={coin} renderFooter={renderFooter}>
      <MarketDetailsHeader
        coin={coin}
        assetCtx={assetCtx}
        universe={universe}
      />

      <View sx={{ height: 240, marginTop: 16 }}>
        <MarketChart
          coin={coin}
          theme={chartTheme}
          surfaceColor={theme.colors.$surfacePrimary}
          resolution={resolution}
          pricescale={pricescale}
        />
      </View>

      <SegmentedControl
        items={RANGE_ITEMS}
        selectedSegmentIndex={selectedSegmentIndex}
        onSelectSegment={handleSelectRange}
        dynamicItemWidth={false}
        backgroundColor={theme.colors.$surfaceSecondary}
        type="thin"
        style={{ marginHorizontal: 16, marginTop: 12 }}
      />

      <View sx={{ marginTop: 16, marginHorizontal: 16 }}>
        <MarketStatistics assetCtx={assetCtx} />
      </View>
    </ScrollScreen>
  )
}
