import { View } from '@avalabs/k2-alpine'
import { TokenPriceChart } from 'common/components/chart/TokenPriceChart'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenHeader } from 'common/components/TokenHeader'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { SectionHeader } from 'features/activity/components/ActivityList'
import { ActionButtons } from 'features/portfolio/assets/components/ActionButtons'
import { TokenActivityListItem } from 'features/portfolio/assets/components/TokenActivityListItem'
import { useTokenDetailData } from 'features/portfolio/assets/hooks/useTokenDetailData'
import React, { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LocalTokenWithBalance } from 'store/balance'

type Props = {
  token: LocalTokenWithBalance | undefined
}

/**
 * Token detail layout for non-XP tokens. Single scrollable surface
 * (`ScrollScreen`) with `TokenHeader` as the cross-fading hero, followed by
 * action buttons, price chart, filter/sort, and the activity items rendered
 * inline. No tabs, no swipe — just one column of content.
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

  const minActivityHeight =
    frame.height - headerHeight - insets.bottom - insets.top

  const tokenHeader = token ? (
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
  ) : null

  const inlineActivityItems = useMemo(() => {
    if (activity.combinedData.length === 0) {
      return (
        <View
          style={{
            minHeight: minActivityHeight,
            paddingBottom: insets.bottom,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          {activity.renderEmptyState()}
        </View>
      )
    }
    return (
      <View
        style={{
          minHeight: minActivityHeight,
          paddingBottom: insets.bottom
        }}>
        {activity.combinedData.map((item, index) => {
          if (item.type === 'header') {
            return (
              <SectionHeader key={item.id} title={item.title} index={index} />
            )
          }
          const tx = item.transaction
          const nextItem = activity.combinedData[index + 1]
          const showSeparator =
            nextItem?.type !== 'header' &&
            index !== activity.combinedData.length - 1
          return (
            <TokenActivityListItem
              key={item.id}
              tx={tx}
              index={index}
              onPress={() => handleExplorerLink(tx.explorerLink)}
              showSeparator={showSeparator}
            />
          )
        })}
      </View>
    )
  }, [activity, handleExplorerLink, insets.bottom, minActivityHeight])

  return (
    <ScrollScreen
      navigationTitle={token?.name ?? ''}
      renderHeader={() => (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {tokenHeader}
        </View>
      )}>
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
      <DropdownSelections
        filter={activity.filter}
        sort={activity.sort}
        sx={{ paddingHorizontal: 16, paddingTop: 10 }}
      />
      {inlineActivityItems}
    </ScrollScreen>
  )
}
