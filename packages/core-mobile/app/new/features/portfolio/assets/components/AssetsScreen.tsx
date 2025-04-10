import { Image, IndexPath, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Space } from 'components/Space'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
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

const errorIcon = require('../../../../assets/icons/rocket.png')

interface Props {
  goToTokenDetail: (localId: string) => void
  goToTokenManagement: () => void
}

const AssetsScreen: FC<Props> = ({
  goToTokenDetail,
  goToTokenManagement
}): JSX.Element => {
  const { data, filter, sort, view, refetch } = useAssetsFilterAndSort()
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
  const numColumns = isGridView ? 2 : 1

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
            onPress={() => goToTokenDetail(item.localId)}
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
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
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

  const dataLength = data.length

  const header = useMemo(() => {
    if (dataLength === 0) return

    return (
      <View sx={styles.dropdownContainer}>
        <DropdownSelections
          sx={styles.dropdown}
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [dataLength, filter, sort, view, handleManageList])

  return (
    <CollapsibleTabs.FlashList
      contentContainerStyle={{ paddingBottom: 16 }}
      data={data}
      numColumns={numColumns}
      estimatedItemSize={isGridView ? 183 : 73} // these numbers are suggested by FlashList at runtime
      renderItem={item => renderItem(item.item, item.index)}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => item.localId}
    />
  )
}

const styles = StyleSheet.create({
  dropdownContainer: {
    paddingHorizontal: 16
  },
  dropdown: {
    marginTop: 4,
    marginBottom: 16
  }
})

export default memo(AssetsScreen)
