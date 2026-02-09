import { SPRING_LINEAR_TRANSITION, View } from '@avalabs/k2-alpine'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Space } from 'common/components/Space'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useAccountBalanceSummary } from 'features/portfolio/hooks/useAccountBalanceSummary'
import React, { FC, memo, useCallback } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import {
  AssetManageView,
  AssetNetworkFilter,
  LocalTokenWithBalance
} from 'store/balance'
import { selectEnabledNetworks } from 'store/network'
import { ViewOption } from 'common/types'
import { useAssetsFilterAndSort } from '../hooks/useAssetsFilterAndSort'
import { EmptyState } from './EmptyState'
import { TokenListItem } from './TokenListItem'

interface Props {
  containerStyle: ViewStyle
  goToTokenDetail: (token: LocalTokenWithBalance) => void
  goToTokenManagement: () => void
  goToBuy: () => void
  onScrollResync: () => void
}

const AssetsScreen: FC<Props> = ({
  containerStyle,
  goToTokenDetail,
  goToTokenManagement,
  goToBuy,
  onScrollResync
}): JSX.Element => {
  const { onResetFilter, data, filter, sort, view, refetch, isRefetching } =
    useAssetsFilterAndSort()
  const listType = view.selected

  const activeAccount = useSelector(selectActiveAccount)
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const {
    isAllBalancesInaccurate,
    isBalanceLoaded,
    isAllBalancesError,
    isLoading: isBalanceLoading,
    isPolling: isBalancePolling,
    isRefetching: isRefetchingBalance
  } = useAccountBalanceSummary(activeAccount)

  const handleManageList = useCallback(
    (value: string): void => {
      if (value === AssetManageView.ManageList) {
        AnalyticsService.capture('PortfolioManageTokenListClicked')
        goToTokenManagement()
        return
      }
      onScrollResync()
      view.onSelected(value)
    },
    [onScrollResync, view, goToTokenManagement]
  )

  const isLoadingBalance =
    isRefetchingBalance || isBalanceLoading || isBalancePolling

  const isGridView = view.selected === ViewOption.Grid
  const numColumns = isGridView ? 2 : 1

  // Only show loading state for initial load
  const isInitialLoading = isLoadingBalance && !isBalanceLoaded

  const hasNoAssets = data.length === 0 && isBalanceLoaded && !isInitialLoading

  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: LocalTokenWithBalance
      index: number
    }): JSX.Element => {
      const isLeftColumn = index % numColumns === 0

      const style = isGridView
        ? {
            marginLeft: isLeftColumn ? 8 : 0,
            marginRight: isLeftColumn ? 0 : 8,
            justifyContent: 'center',
            flex: 1,
            alignItems: 'center'
          }
        : {
            paddingHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'stretch'
          }

      return (
        <View sx={style}>
          <TokenListItem
            token={item}
            index={index}
            onPress={goToTokenDetail}
            isGridView={isGridView}
          />
        </View>
      )
    },
    [goToTokenDetail, numColumns, isGridView]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return <Space y={isGridView ? 12 : 10} />
  }, [isGridView])

  const renderEmptyComponent = useCallback(() => {
    // Only show loading state during initial load, not background polling
    if (isInitialLoading || !isBalanceLoaded || enabledNetworks.length === 0) {
      return (
        <CollapsibleTabs.ContentWrapper>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (isBalanceLoaded && (isAllBalancesError || isAllBalancesInaccurate)) {
      return (
        <CollapsibleTabs.ContentWrapper>
          <ErrorState
            description="Please hit refresh or try again later"
            button={{
              title: 'Refresh',
              onPress: refetch
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (filter.selected === AssetNetworkFilter.AllNetworks && hasNoAssets) {
      // Special case where we cannot use CollapsibleTabs.ContentWrapper
      // height needs to be calculated separately
      return <EmptyState goToBuy={goToBuy} />
    }

    // if the filter is the default filter, this error state does not apply
    if (
      filter.selected !== AssetNetworkFilter.AllNetworks &&
      data.length === 0
    ) {
      return (
        <CollapsibleTabs.ContentWrapper>
          <ErrorState
            title="No assets found"
            description="Try changing the filter settings or reset the filter to see all assets."
            button={{
              title: 'Reset filter',
              onPress: onResetFilter
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }
  }, [
    isInitialLoading,
    isBalanceLoaded,
    enabledNetworks.length,
    isAllBalancesError,
    isAllBalancesInaccurate,
    filter.selected,
    hasNoAssets,
    data.length,
    refetch,
    goToBuy,
    onResetFilter
  ])

  const renderEmpty = useCallback(() => {
    return renderEmptyComponent()
  }, [renderEmptyComponent])

  const renderHeader = useCallback(() => {
    if (isInitialLoading) {
      return null
    }

    return (
      <View
        style={{
          paddingHorizontal: 16,
          zIndex: 1000
        }}>
        <DropdownSelections
          sx={{ marginBottom: hasNoAssets ? 0 : 16 }}
          filter={hasNoAssets ? undefined : filter}
          sort={hasNoAssets ? undefined : sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [isInitialLoading, hasNoAssets, filter, sort, view, handleManageList])

  const keyExtractor = useCallback(
    (item: LocalTokenWithBalance, _index: number): string =>
      `${item.networkChainId}-${item.localId}`,
    []
  )

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(10)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <CollapsibleTabList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        containerStyle={containerStyle}
        renderEmpty={renderEmpty}
        renderHeader={renderHeader}
        renderSeparator={renderSeparator}
        isRefreshing={isRefetching}
        onRefresh={refetch}
        numColumns={numColumns}
        extraData={{ isGridView }}
        listKey={`assets-list-${listType}`}
        testID="portfolio_token_list"
      />
    </Animated.View>
  )
}

export default memo(AssetsScreen)
