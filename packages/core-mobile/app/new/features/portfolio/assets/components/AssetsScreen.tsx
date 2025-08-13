import { SPRING_LINEAR_TRANSITION, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Space } from 'common/components/Space'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { FC, memo, useCallback, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  ViewStyle
} from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import {
  AssetManageView,
  LocalTokenWithBalance,
  selectBalanceTotalInCurrencyForAccount,
  selectIsAllBalancesError,
  selectIsAllBalancesInaccurate,
  selectIsPollingBalances,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectIsBalanceLoadedForAccount,
  AssetNetworkFilter
} from 'store/balance'
import { selectEnabledNetworks } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { useAssetsFilterAndSort } from '../hooks/useAssetsFilterAndSort'
import { TokenListItem } from './TokenListItem'
import { EmptyState } from './EmptyState'

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
  const {
    onResetFilter,
    data,
    filter,
    sort,
    view,
    refetch,
    isRefetching,
    isLoading
  } = useAssetsFilterAndSort()

  const activeAccount = useSelector(selectActiveAccount)
  const enabledNetworks = useSelector(selectEnabledNetworks)

  const isAllBalancesInaccurate = useSelector(
    selectIsAllBalancesInaccurate(activeAccount?.id)
  )
  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAccount(activeAccount?.id ?? '')
  )
  const isAllBalancesError = useSelector(selectIsAllBalancesError)
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isBalancePolling = useSelector(selectIsPollingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.id ?? '',
      tokenVisibility
    )
  )
  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | null>(null)

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
    [goToTokenManagement, view, onScrollResync]
  )

  const isLoadingBalance = isRefetchingBalance || isBalanceLoading
  const isGridView = view.selected === AssetManageView.Grid
  const numColumns = isGridView ? 2 : 1

  const hasNoAssets =
    isBalanceLoaded &&
    balanceTotalInCurrency === 0 &&
    !isLoadingBalance &&
    !isBalancePolling

  const renderItem = useCallback(
    (item: LocalTokenWithBalance, index: number): JSX.Element => {
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
            onPress={() => goToTokenDetail(item)}
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
    if (isLoadingBalance || !isBalanceLoaded || isBalancePolling) {
      return <LoadingState />
    }

    if (isBalanceLoaded && (isAllBalancesError || isAllBalancesInaccurate)) {
      return (
        <ErrorState
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refetch
          }}
        />
      )
    }

    if (filter.selected === AssetNetworkFilter.AllNetworks && hasNoAssets) {
      return <EmptyState goToBuy={goToBuy} />
    }

    // if the filter is the default filter, this error state does not apply
    if (filter.selected !== AssetNetworkFilter.AllNetworks && hasNoAssets) {
      return (
        <ErrorState
          title="No assets found"
          description="Try changing the filter settings or reset the filter to see all assets."
          button={{
            title: 'Reset filter',
            onPress: onResetFilter
          }}
        />
      )
    }
  }, [
    isLoadingBalance,
    isBalanceLoaded,
    isAllBalancesError,
    isAllBalancesInaccurate,
    hasNoAssets,
    filter.selected,
    isBalancePolling,
    refetch,
    goToBuy,
    onResetFilter
  ])

  const renderEmpty = useCallback(() => {
    const height =
      Number(containerStyle.minHeight) - (headerLayout?.height ?? 0)
    return (
      <CollapsibleTabs.ContentWrapper height={height}>
        {renderEmptyComponent()}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [containerStyle.minHeight, renderEmptyComponent, headerLayout?.height])

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderLayout(e.nativeEvent.layout)
  }, [])

  const renderHeader = useCallback(() => {
    if (hasNoAssets || isLoadingBalance) {
      return
    }

    return (
      <View
        onLayout={onHeaderLayout}
        style={{
          paddingHorizontal: 16
        }}>
        <DropdownSelections
          sx={{ marginBottom: 16 }}
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [
    hasNoAssets,
    isLoadingBalance,
    onHeaderLayout,
    filter,
    sort,
    view,
    handleManageList
  ])

  const overrideProps = {
    contentContainerStyle: {
      ...containerStyle
    }
  }

  const header = useHeaderMeasurements()

  if (isBalanceLoading || enabledNetworks.length === 0) {
    return (
      <LoadingState
        sx={{
          paddingTop: Platform.OS === 'ios' ? header.height : 0,
          minHeight: containerStyle.minHeight,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    )
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(10)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <CollapsibleTabs.FlashList
        data={data}
        keyExtractor={(item, index) =>
          `${index}-${item.networkChainId}-${item.localId}`
        }
        testID="portfolio_token_list"
        extraData={{ isGridView }}
        overrideProps={overrideProps}
        numColumns={numColumns}
        estimatedItemSize={isGridView ? 183 : 73}
        renderItem={item => renderItem(item.item, item.index)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching || isLoading}
        onRefresh={refetch}
      />
    </Animated.View>
  )
}

export default memo(AssetsScreen)
