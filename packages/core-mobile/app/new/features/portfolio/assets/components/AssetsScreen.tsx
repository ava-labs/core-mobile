import {
  Image,
  IndexPath,
  SPRING_LINEAR_TRANSITION,
  View
} from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Space } from 'common/components/Space'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
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
import { selectEnabledNetworks } from 'store/network'
import errorIcon from '../../../../assets/icons/rocket.png'
import { useAssetsFilterAndSort } from '../hooks/useAssetsFilterAndSort'
import { TokenListItem } from './TokenListItem'

interface Props {
  containerStyle: ViewStyle
  goToTokenDetail: (localId: string, chainId: number) => void
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
  const { data, filter, sort, view, refetch, isRefetching, isLoading } =
    useAssetsFilterAndSort()
  const activeAccount = useSelector(selectActiveAccount)
  const enabledNetworks = useSelector(selectEnabledNetworks)

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
      onScrollResync()
      view.onSelected(indexPath)
    },
    [goToTokenManagement, view, onScrollResync]
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
            onPress={() => goToTokenDetail(item.localId, item.networkChainId)}
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
    if (isRefetchingBalance) {
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
          onPress: goToBuy
        }}
      />
    )
  }, [isRefetchingBalance, isAllBalancesInaccurate, goToBuy, refetch])

  const header = useMemo(() => {
    return (
      <View
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
  }, [filter, sort, view, handleManageList])

  const overrideProps = {
    contentContainerStyle: {
      ...containerStyle
    }
  }

  if (isBalanceLoading || enabledNetworks.length === 0) {
    return <LoadingState sx={{ height: portfolioTabContentHeight * 2 }} />
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
        key={isGridView ? 'grid' : 'list'}
        keyExtractor={(item, index) =>
          `${index}-${item.networkChainId}-${item.localId}`
        }
        overrideProps={overrideProps}
        numColumns={numColumns}
        estimatedItemSize={isGridView ? 183 : 73}
        renderItem={item => renderItem(item.item, item.index)}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching || isLoading}
        onRefresh={refetch}
      />
    </Animated.View>
  )
}

export default memo(AssetsScreen)
