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
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useFilterAndSort } from 'features/portfolio/assets/hooks/useFilterAndSort'
import { LoadingState } from 'common/components/LoadingState'
import { ListRenderItemInfo } from 'react-native'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { portfolioTabContentHeight } from '../../utils'
import { AssetsHeader } from './AssetsHeader'
import { TokenListItem } from './TokenListItem'

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

  const emptyComponent = useMemo(() => {
    if (isBalanceLoading || isRefetchingBalance) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (isAllBalancesInaccurate) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refetch
          }}
        />
      )
    }

    if (filteredTokenList.length === 0) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          title="No Assets yet"
          description="Add your crypto tokens to track your portfolio’s performance and stay updated on your investments"
        />
      )
    }
  }, [
    isBalanceLoading,
    isRefetchingBalance,
    filteredTokenList,
    refetch,
    isAllBalancesInaccurate
  ])

  const header = useMemo(() => {
    return (
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <AssetsHeader
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
      ListEmptyComponent={emptyComponent}
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
