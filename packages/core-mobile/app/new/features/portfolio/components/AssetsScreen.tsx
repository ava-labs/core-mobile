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
import { selectActiveAccount } from 'store/account'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { ListFilterHeader } from 'features/portfolio/components/ListFilterHeader'
import { TokenListItem } from 'features/portfolio/components/assets/TokenListItem'
import { useFilterAndSort } from 'features/portfolio/components/assets/useFilterAndSort'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'
import { ListRenderItemInfo } from 'react-native'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'

export const AssetsScreen = (): JSX.Element => {
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
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <ListFilterHeader filter={filter} sort={sort} view={view} />
      </View>
    )
  }, [filter, sort, view])

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={{ overflow: 'visible', paddingBottom: 16 }}
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
