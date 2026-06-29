import { View } from '@avalabs/k2-alpine'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Space } from 'common/components/Space'
import { GRID_GAP } from 'common/consts'
import { ViewOption } from 'common/types'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useAccountBalanceSummary } from 'features/portfolio/hooks/useAccountBalanceSummary'
import React, { FC, memo, useCallback, useMemo } from 'react'
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
import { useAssetsFilterAndSort } from '../hooks/useAssetsFilterAndSort'
import { EmptyState } from './EmptyState'
import { TokenListItem } from './TokenListItem'

interface Props {
  containerStyle: ViewStyle
  goToTokenDetail: (token: LocalTokenWithBalance) => void
  goToTokenManagement: () => void
  goToBuy: () => void
  onScrollResync: () => void
  onScrollToTop: () => void
}

const AssetsScreen: FC<Props> = ({
  containerStyle,
  goToTokenDetail,
  goToTokenManagement,
  goToBuy,
  onScrollResync,
  onScrollToTop
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

  const handleFilterSelected = useCallback(
    (value: string): void => {
      onScrollToTop()
      filter.onSelected(value)
    },
    [filter, onScrollToTop]
  )

  const handleSortSelected = useCallback(
    (value: string): void => {
      onScrollToTop()
      sort.onSelected(value)
    },
    [onScrollToTop, sort]
  )

  const filterSelection = useMemo(
    () => ({
      ...filter,
      onSelected: handleFilterSelected
    }),
    [filter, handleFilterSelected]
  )

  const sortSelection = useMemo(
    () => ({
      ...sort,
      onSelected: handleSortSelected
    }),
    [handleSortSelected, sort]
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
            // Row gap is applied per-cell (not via ItemSeparatorComponent): in a
            // FlashList v2 multi-column (flexWrap) grid a vertical separator
            // isn't reliably row-aligned, which produced uneven vertical gaps.
            marginBottom: GRID_GAP,
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

  // List view only. The grid view spaces rows via per-cell `marginBottom`
  // (see renderItem) because FlashList v2's flexWrap grid doesn't row-align an
  // ItemSeparatorComponent.
  const renderSeparator = useCallback((): JSX.Element => {
    return <Space y={10} />
  }, [])

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
          filter={hasNoAssets ? undefined : filterSelection}
          sort={hasNoAssets ? undefined : sortSelection}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [
    isInitialLoading,
    hasNoAssets,
    filterSelection,
    sortSelection,
    view,
    handleManageList
  ])

  const keyExtractor = useCallback(
    (item: LocalTokenWithBalance, _index: number): string =>
      `${item.networkChainId}-${item.localId}`,
    []
  )

  // Remount the list whenever the column ordering can change (account, view
  // type, filter, or sort). On Fabric, FlashList recycles/repositions grid
  // cells on an in-place `data` reorder without reliably recomputing the
  // `numColumns` layout, which leaves uneven gaps / misaligned columns. Keying
  // by the active selections gives each ordering a fresh layout pass. The key
  // stays stable per selection (it doesn't include item count or streamed
  // balance values) so it doesn't thrash on background balance refreshes.
  const assetsListKey = useMemo(
    () =>
      `assets-list-${activeAccount?.id ?? 'unknown'}-${listType}-${
        filter.selected
      }-${sort.selected}`,
    [activeAccount?.id, listType, filter.selected, sort.selected]
  )

  const maintainVisibleContentPosition = useMemo(() => {
    // we need to maintain the visible content position for the grid view
    // otherwise the list will look broken
    if (isGridView) {
      return { disabled: false }
    }
    return { disabled: true }
  }, [isGridView])

  return (
    <Animated.View
      testID="portfolio_token_list"
      entering={getListItemEnteringAnimation(10)}
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
        renderSeparator={isGridView ? undefined : renderSeparator}
        isRefreshing={isRefetching}
        onRefresh={refetch}
        numColumns={numColumns}
        extraData={{ isGridView }}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        listKey={assetsListKey}
        testID="portfolio_token_list"
      />
    </Animated.View>
  )
}

export default memo(AssetsScreen)
