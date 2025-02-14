import React, { useMemo } from 'react'
import {
  AssetManageView,
  LocalTokenWithBalance,
  selectIsAllBalancesInaccurate,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectNonNFTTokensWithBalanceForAccount
} from 'store/balance'
import { View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { selectActiveAccount } from 'store/account'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { ListFilterHeader } from 'features/portfolio/components/ListFilterHeader'
import { TokenListItem } from 'features/portfolio/components/assets/TokenListItem'
import { useFilterAndSort } from 'features/portfolio/components/assets/useFilterAndSort'
import { ActionButtonTitle } from 'features/portfolio/components/assets/consts'
import {
  ActionButton,
  TActionButton
} from 'features/portfolio/components/assets/ActionButton'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'
import {
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import { HFlatList } from 'react-native-head-tab-view'
import { PortfolioHomeScreenTab } from 'new/routes/(signedIn)/(tabs)/portfolio'

export const AssetsScreen = ({
  tabIndex,
  onScroll
}: {
  tabIndex: PortfolioHomeScreenTab
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}): JSX.Element => {
  const { data, filter, sort, view } = useFilterAndSort()

  const { refetch } = useSearchableTokenList()
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector((state: RootState) =>
    selectNonNFTTokensWithBalanceForAccount(state, activeAccount?.index)
  )
  const isAllBalancesInaccurate = useSelector(
    selectIsAllBalancesInaccurate(activeAccount?.index ?? 0)
  )
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  const goToTokenDetail = (): void => {
    // TODO: go to token detail
  }

  const isGridView =
    view.data[0]?.[view.selected.row] === AssetManageView.Highlights

  const renderItem = (
    item: ListRenderItemInfo<LocalTokenWithBalance>
  ): JSX.Element => {
    return (
      <View sx={{ paddingHorizontal: isGridView ? 0 : 16 }}>
        <TokenListItem
          token={item.item}
          index={item.index}
          onPress={goToTokenDetail}
          isGridView={isGridView}
        />
      </View>
    )
  }

  const renderActionItem = (
    item: TActionButton,
    index: number
  ): JSX.Element => {
    return <ActionButton item={item} index={index} key={index} />
  }

  const renderSeparator = (): JSX.Element => {
    return <Space y={isGridView ? 16 : 10} />
  }

  const emptyState = useMemo(() => {
    if (isBalanceLoading || isRefetchingBalance) {
      return <LoadingState />
    }

    if (isAllBalancesInaccurate) {
      return <ErrorState onPress={refetch} />
    }

    if (tokens.length === 0) {
      return <EmptyAssets />
    }
  }, [
    isAllBalancesInaccurate,
    isBalanceLoading,
    isRefetchingBalance,
    tokens,
    refetch
  ])

  const header = useMemo(() => {
    return (
      <View sx={{ paddingHorizontal: 16, overflow: 'hidden' }}>
        <Animated.FlatList
          style={{ overflow: 'visible' }}
          contentContainerStyle={{ gap: 10 }}
          horizontal
          scrollEventThrottle={16}
          data={ACTION_BUTTONS}
          renderItem={item => renderActionItem(item.item, item.index)}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          itemLayoutAnimation={LinearTransition.springify()}
        />
        <ListFilterHeader filter={filter} sort={sort} view={view} />
      </View>
    )
  }, [filter, sort, view])

  return (
    <HFlatList
      onScroll={onScroll}
      style={{ paddingTop: 30, overflow: 'visible' }}
      index={tabIndex}
      data={data}
      numColumns={isGridView ? 2 : 1}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyState}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => (item as LocalTokenWithBalance).localId}
      columnWrapperStyle={
        isGridView && {
          paddingHorizontal: 16,
          justifyContent: 'space-between',
          gap: 16
        }
      }
    />
  )
}

const ACTION_BUTTONS = [
  { title: ActionButtonTitle.Send, icon: 'send' },
  { title: ActionButtonTitle.Swap, icon: 'swap' },
  { title: ActionButtonTitle.Buy, icon: 'buy' },
  { title: ActionButtonTitle.Stake, icon: 'stake' },
  { title: ActionButtonTitle.Bridge, icon: 'bridge' },
  { title: ActionButtonTitle.Connect, icon: 'connect' }
]
