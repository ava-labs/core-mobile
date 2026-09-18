import {
  Button,
  Icons,
  SegmentedControl,
  SlidingButton,
  Text,
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
import { MarketHistory } from '../components/MarketHistory'
import { MarketStatistics } from '../components/MarketStatistics'
import { PerpsGeoRestrictionWarning } from '../components/PerpsGeoRestrictionWarning'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'
import { usePerpsClearinghouse } from '../hooks/usePerpsClearinghouse'
import { FALLBACK_COIN } from '../utils/economics'
import { normalizePerpCoinParam, tickerOfCoin } from '../utils/coinDex'

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
  // Preserve HIP-3 dex case (`xyz:CL`); only the ticker is upper-cased.
  const coin = normalizePerpCoinParam(coinParam ?? FALLBACK_COIN)

  const { isGeoBlocked } = usePerpsAvailability()

  // Funded when the account has any Hyperliquid equity: the footer shows
  // `Short / Long` when funded, else `Slide to deposit`. When the balance can't
  // be loaded (API outage) we don't know either way, so we must NOT fall back to
  // "$0 → deposit" and mis-steer a funded user; show a retry instead.
  const {
    accountValueUsd,
    isError: balanceError,
    refetch: refetchBalance
  } = usePerpsClearinghouse()
  const balanceUnknown = accountValueUsd === undefined && balanceError
  const hasBalance = (accountValueUsd ?? 0) > 0

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

  // Pass the live mark price so the order screen seeds a real entry price (and
  // sizes correctly) instead of falling back to the placeholder default.
  const markPx = assetCtx?.markPx

  const handleShort = useCallback(() => {
    const priceParam = markPx !== undefined ? `&price=${markPx}` : ''
    router.push(
      `/perpetualsPlaceOrder?coin=${encodeURIComponent(
        coin
      )}&side=short${priceParam}`
    )
  }, [coin, markPx, router])

  const handleLong = useCallback(() => {
    const priceParam = markPx !== undefined ? `&price=${markPx}` : ''
    router.push(
      `/perpetualsPlaceOrder?coin=${encodeURIComponent(
        coin
      )}&side=long${priceParam}`
    )
  }, [coin, markPx, router])

  const renderFooter = useCallback(() => {
    // Perps unavailable in this region — replace the trade CTA with the
    // geo-restriction notice. The rest of the screen stays browsable.
    if (isGeoBlocked) {
      return <PerpsGeoRestrictionWarning />
    }

    // Balance unknown (outage): don't present the deposit CTA as if unfunded.
    if (balanceUnknown) {
      return (
        <View sx={{ gap: 8, alignItems: 'center' }}>
          <Text
            variant="caption"
            sx={{ color: '$textSecondary', textAlign: 'center' }}>
            Couldn’t load your balance. Check your connection and try again.
          </Text>
          <Button
            type="secondary"
            size="large"
            onPress={refetchBalance}
            testID="perpetuals_details_balance_retry">
            Retry
          </Button>
        </View>
      )
    }

    if (!hasBalance) {
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
    isGeoBlocked,
    balanceUnknown,
    refetchBalance,
    hasBalance,
    handleDeposit,
    handleShort,
    handleLong,
    theme.colors.$textDanger,
    theme.colors.$textSuccess
  ])

  return (
    <ScrollScreen
      isModal
      navigationTitle={tickerOfCoin(coin)}
      renderFooter={renderFooter}>
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

      <MarketHistory coin={coin} />
    </ScrollScreen>
  )
}
