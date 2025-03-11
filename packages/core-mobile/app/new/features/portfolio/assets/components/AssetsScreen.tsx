import { Image, IndexPath, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { Space } from 'components/Space'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import {
  ASSET_MANAGE_VIEWS,
  AssetManageView,
  LocalTokenWithBalance,
  selectIsAllBalancesInaccurate,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { portfolioTabContentHeight } from '../../utils'
import { useAssetsFilterAndSort } from '../hooks/useAssetsFilterAndSort'
import { TokenListItem } from './TokenListItem'

interface Props {
  goToTokenDetail: (localId: string) => void
  goToTokenManagement: () => void
}

const AssetsScreen: FC<Props> = ({
  goToTokenDetail,
  goToTokenManagement
}): JSX.Element => {
  const { data, filter, sort, view } = useAssetsFilterAndSort()

  const { refetch } = useSearchableTokenList({})
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

  const isGridView = view.data[0]?.[view.selected.row] === AssetManageView.Grid

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
    return <Space y={isGridView ? 12 : 10} />
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

    return (
      <ErrorState
        sx={{ height: portfolioTabContentHeight }}
        icon={
          <Image
            source={require('../../../../assets/icons/rocket.png')}
            sx={{ width: 42, height: 42 }}
          />
        }
        title="No assets yet"
        description="On-ramp using Core in two minutes"
        button={{
          title: 'Let’s go!',
          onPress: () => {
            // TODO: navigate to buy on-ramp
          }
        }}
      />
    )
  }, [isBalanceLoading, isRefetchingBalance, refetch, isAllBalancesInaccurate])

  const header = useMemo(() => {
    return (
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <DropdownSelections
          sx={{ marginTop: 20, marginBottom: 16 }}
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [filter, sort, view, handleManageList])

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={{
        overflow: 'visible',
        paddingBottom: 16
      }}
      data={data}
      numColumns={isGridView ? 2 : 1}
      renderItem={renderItem}
      ListHeaderComponent={data.length > 0 ? header : undefined}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => (item as LocalTokenWithBalance).localId}
      columnWrapperStyle={
        isGridView && {
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }
      }
    />
  )
}

export default memo(AssetsScreen)
