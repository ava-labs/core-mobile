import React, { FC, memo, useCallback, useMemo } from 'react'
import {
  ASSET_MANAGE_VIEWS,
  AssetManageView,
  LocalTokenWithBalance,
  selectIsAllBalancesInaccurate,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { IndexPath, View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { ListFilterHeader } from 'features/portfolio/components/ListFilterHeader'
import { TokenListItem } from 'features/portfolio/components/assets/TokenListItem'
import { useFilterAndSort } from 'features/portfolio/components/assets/useFilterAndSort'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'
import { ListRenderItemInfo } from 'react-native'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'

interface Props {
  goToTokenDetail: (localId: string) => void
  goToTokenManagement: () => void
}

const AssetsScreen: FC<Props> = ({
  goToTokenDetail,
  goToTokenManagement
}): JSX.Element => {
  const { data, filter, sort, view } = useFilterAndSort()

  const { refetch, filteredTokenList } = useSearchableTokenList()
  const activeAccount = useSelector(selectActiveAccount)

  const isAllBalancesInaccurate = useSelector(
    selectIsAllBalancesInaccurate(activeAccount?.index ?? 0)
  )
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  const handleManageList = useCallback(
    (indexPath: IndexPath): void => {
      const manageList =
        ASSET_MANAGE_VIEWS?.[indexPath.section]?.[indexPath.row]
      if (manageList === AssetManageView.ManageList) {
        goToTokenManagement()
        return
      }
      view.onSelected(indexPath)
    },
    [goToTokenManagement, view]
  )

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
          onPress={() => goToTokenDetail(item.item.localId)}
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

    if (filteredTokenList.length === 0) {
      return <EmptyAssets />
    }
  }, [
    isAllBalancesInaccurate,
    isBalanceLoading,
    isRefetchingBalance,
    filteredTokenList,
    refetch
  ])

  const header = useMemo(() => {
    return (
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <ListFilterHeader
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [filter, sort, view, handleManageList])

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

export default memo(AssetsScreen)
