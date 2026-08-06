import { View } from '@avalabs/k2-alpine'
import { TokenPriceChart } from 'common/components/chart/TokenPriceChart'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenHeader } from 'common/components/TokenHeader'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { ActionButtons } from 'features/portfolio/assets/components/ActionButtons'
import TransactionHistory from 'features/portfolio/assets/components/TransactionHistory'
import { useTokenDetailData } from 'features/portfolio/assets/hooks/useTokenDetailData'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { InteractionManager, useWindowDimensions } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LocalTokenWithBalance } from 'store/balance'

type Props = {
  token: LocalTokenWithBalance | undefined
}

// Height `TokenPriceChart` (common/components/chart/TokenPriceChart.tsx)
// occupies once mounted, so the placeholder below can reserve the exact
// same space and the deferred mount (CP-14918, "Fix 3") causes zero layout
// shift. Derived from its source, not measured at runtime. Fixed part common
// to every chart state: wrapper `paddingBottom` (18) + 2x inter-child `gap`
// (12) + `PriceChart` default `height` prop (235) + range-selector/type-
// toggle row (max(SegmentedControl "thin" 36, ChartTypeToggle 36) = 36)
// = 18 + 24 + 235 + 36 = 313. Only `ChartHeader`'s height varies by state:
//   - loading: ChartHeaderSkeleton, SKELETON_HEIGHT = 62 (ChartHeader.tsx:169-195)
//       -> 313 + 62 = 375
//   - loaded: heading3 (27) + subtitle2 (16) + PriceChangeIndicator's
//     lineHeight-18 override (ChartHeader.tsx:302-311) = 61 -> 313 + 61 = 374
//   - empty/error (no indicator, falls back to a plain buttonSmall "-"):
//     heading3 (27) + subtitle2 (16) + buttonSmall (14) = 57 -> 313 + 57 = 370
// The chart always mounts into `loading` first (the candles query only
// starts once this deferred mount happens), so 375 is the height actually
// present at swap-in — the shift the deferral causes. The later
// 375 -> 374 settle as data arrives is the chart's own intrinsic layout
// change, not something this placeholder is responsible for.
const TOKEN_PRICE_CHART_HEIGHT = 375

export const NonXpTokenDetailScreen = ({ token }: Props): JSX.Element => {
  // Defer the Skia price chart past the push animation. Mounting a Canvas plus
  // its Simultaneous(LongPress, Pan) gesture in the first commit put native
  // binding and gesture-recogniser construction inside the tap-to-paint window
  // (CP-14918). Header and action buttons paint first; the chart follows.
  const [isChartReady, setIsChartReady] = useState(false)
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() =>
      setIsChartReady(true)
    )
    return () => handle.cancel()
  }, [])

  const frame = useWindowDimensions()
  const headerHeight = useEffectiveHeaderHeight()
  const insets = useSafeAreaInsets()

  const {
    formattedBalance,
    selectedCurrency,
    isBalanceAccurate,
    isBalanceLoading,
    isPrivacyModeEnabled,
    isPriceChartBlocked,
    actionButtons,
    handleExplorerLink,
    trackTokenId,
    handleOpenTrackTokenDetail,
    activity
  } = useTokenDetailData(token)

  const renderHeader = useCallback(() => {
    if (!token) return null
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <TokenHeader
          token={token}
          formattedBalance={formattedBalance}
          currency={selectedCurrency}
          errorMessage={
            isBalanceAccurate ? undefined : 'Unable to load all balances'
          }
          isLoading={isBalanceLoading}
          isPrivacyModeEnabled={isPrivacyModeEnabled}
        />
      </View>
    )
  }, [
    token,
    formattedBalance,
    selectedCurrency,
    isBalanceAccurate,
    isBalanceLoading,
    isPrivacyModeEnabled
  ])

  const containerStyle = useMemo(
    () => ({
      minHeight: frame.height - headerHeight - insets.top
    }),
    [frame.height, headerHeight, insets.top]
  )

  return (
    <ScrollScreen
      navigationTitle={token?.name ?? ''}
      refreshControl={
        <RefreshControl
          progressViewOffset={headerHeight}
          refreshing={activity.isRefreshing}
          onRefresh={activity.refresh}
        />
      }
      renderHeader={renderHeader}>
      <ActionButtons
        buttons={actionButtons}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24
        }}
      />
      {isPriceChartBlocked || !token ? null : isChartReady ? (
        <TokenPriceChart
          token={token}
          width={frame.width}
          onPriceHeaderPress={
            trackTokenId ? handleOpenTrackTokenDetail : undefined
          }
        />
      ) : (
        // Reserves the space `TokenPriceChart` will occupy so its deferred
        // mount above doesn't reflow `TransactionHistory` below it.
        <View style={{ height: TOKEN_PRICE_CHART_HEIGHT }} />
      )}
      <TransactionHistory
        mode="plain"
        token={token}
        handleExplorerLink={handleExplorerLink}
        activity={activity}
        containerStyle={containerStyle}
      />
    </ScrollScreen>
  )
}
