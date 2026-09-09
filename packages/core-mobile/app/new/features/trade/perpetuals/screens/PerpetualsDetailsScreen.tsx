import {
  Button,
  Icons,
  ScrollView,
  SegmentedControl,
  SlidingButton,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { RESOLUTION_TO_INTERVAL, type TvResolution } from '@avalabs/perps-sdk'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useRef, useState } from 'react'
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView as RNScrollView
} from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { MarketChart } from '../components/MarketChart'
import { MarketDetailsHeader } from '../components/MarketDetailsHeader'
import { MarketStatistics } from '../components/MarketStatistics'
import { PerpsGeoRestrictionWarning } from '../components/PerpsGeoRestrictionWarning'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'
import { usePerpsClearinghouse } from '../hooks/usePerpsClearinghouse'
import { FALLBACK_COIN } from '../utils/economics'
import { normalizePerpCoinParam, tickerOfCoin } from '../utils/coinDex'

// Curated subset of the TradingView resolutions the chart's datafeed supports
// (1M 5M 15M 1H 4H 12H 1D 1W). Labels are the Hyperliquid interval names,
// upper-cased. Note: adding the month resolution back would collide with `1M`
// (minute) — labels would need rethinking then.
const RANGE_RESOLUTIONS: readonly TvResolution[] = [
  '1',
  '5',
  '15',
  '60',
  '240',
  '720',
  '1D',
  '1W'
]

const RANGES = RANGE_RESOLUTIONS.map(resolution => ({
  label: RESOLUTION_TO_INTERVAL[resolution].toUpperCase(),
  resolution
}))

const RANGE_ITEMS = RANGES.map(r => ({ title: r.label }))

// Fixed per-segment width: the control must be wider than the screen (it lives
// in a horizontal ScrollView), so it can't size itself from its container.
const RANGE_SEGMENT_WIDTH = 52

// Horizontal padding of the range list; also the breathing room kept around a
// segment when scrolling it into view.
const RANGE_LIST_PADDING = 16

const DEFAULT_RANGE_INDEX = Math.max(
  RANGES.findIndex(r => r.resolution === '60'), // 1h, the previous default
  0
)

export const PerpetualsDetailsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(DEFAULT_RANGE_INDEX)
  const selectedSegmentIndex = useSharedValue(DEFAULT_RANGE_INDEX)

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

  const rangeScrollRef = useRef<RNScrollView>(null)
  const rangeScrollOffset = useRef(0)
  const rangeViewportWidth = useRef(0)

  const handleRangeScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      rangeScrollOffset.current = event.nativeEvent.contentOffset.x
    },
    []
  )

  const handleRangeLayout = useCallback((event: LayoutChangeEvent) => {
    rangeViewportWidth.current = event.nativeEvent.layout.width
  }, [])

  const handleSelectRange = useCallback(
    (index: number) => {
      selectedSegmentIndex.value = index
      setSelectedIndex(index)

      // A segment at the edge can be tapped while partially clipped — scroll
      // it fully into view, keeping the list padding as breathing room.
      const viewport = rangeViewportWidth.current
      if (viewport === 0) return
      const itemStart = RANGE_LIST_PADDING + index * RANGE_SEGMENT_WIDTH
      const itemEnd = itemStart + RANGE_SEGMENT_WIDTH
      const offset = rangeScrollOffset.current
      if (itemStart - RANGE_LIST_PADDING < offset) {
        rangeScrollRef.current?.scrollTo({
          x: itemStart - RANGE_LIST_PADDING,
          animated: true
        })
      } else if (itemEnd + RANGE_LIST_PADDING > offset + viewport) {
        rangeScrollRef.current?.scrollTo({
          x: itemEnd + RANGE_LIST_PADDING - viewport,
          animated: true
        })
      }
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

      <ScrollView
        ref={rangeScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleRangeScroll}
        scrollEventThrottle={16}
        onLayout={handleRangeLayout}
        style={{ flexGrow: 0, marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: RANGE_LIST_PADDING }}>
        <SegmentedControl
          items={RANGE_ITEMS}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={handleSelectRange}
          dynamicItemWidth={false}
          backgroundColor={theme.colors.$surfaceSecondary}
          type="thin"
          style={{ width: RANGES.length * RANGE_SEGMENT_WIDTH }}
        />
      </ScrollView>

      <View sx={{ marginTop: 16, marginHorizontal: 16 }}>
        <MarketStatistics assetCtx={assetCtx} />
      </View>
    </ScrollScreen>
  )
}
