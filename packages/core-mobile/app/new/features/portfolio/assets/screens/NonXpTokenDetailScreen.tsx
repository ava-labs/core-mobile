import { View } from '@avalabs/k2-alpine'
import { TokenPriceChart } from 'common/components/chart/TokenPriceChart'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenHeader } from 'common/components/TokenHeader'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { ActionButtons } from 'features/portfolio/assets/components/ActionButtons'
import TransactionHistory from 'features/portfolio/assets/components/TransactionHistory'
import { useTokenDetailData } from 'features/portfolio/assets/hooks/useTokenDetailData'
import React, { useCallback, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LocalTokenWithBalance } from 'store/balance'

type Props = {
  token: LocalTokenWithBalance | undefined
}

/**
 * Token detail layout for non-XP tokens. `ScrollScreen` owns the vertical
 * scroll and pull-to-refresh; inside it, `TokenHeader`, action buttons, and
 * the price chart render at the top, followed by `TransactionHistory` in
 * `plain` mode (non-scrolling FlashList sized to content) for the activity
 * list. The outer ScrollScreen handles all scrolling.
 */
export const NonXpTokenDetailScreen = ({ token }: Props): JSX.Element => {
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
      {isPriceChartBlocked || !token ? null : (
        <TokenPriceChart
          token={token}
          width={frame.width}
          onPriceHeaderPress={
            trackTokenId ? handleOpenTrackTokenDetail : undefined
          }
        />
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
