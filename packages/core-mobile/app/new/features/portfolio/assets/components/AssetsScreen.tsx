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
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  ViewStyle
} from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import {
  ASSET_MANAGE_VIEWS,
  AssetManageView,
  LocalTokenWithBalance,
  selectIsAllBalancesInaccurate,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { selectEnabledNetworks } from 'store/network'
import { selectActiveAccount } from 'store/account'
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
  const activeAccount = useSelector(selectActiveAccount) //TODO: should use useActiveAccount but crashes if deleting wallet or just onboarding, race condition
  const enabledNetworks = useSelector(selectEnabledNetworks)

  const isAllBalancesInaccurate = useSelector(
    selectIsAllBalancesInaccurate(activeAccount?.id)
  )
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | null>(null)

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
      return <LoadingState />
    }
    if (isAllBalancesInaccurate) {
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

    return (
      <ErrorState
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

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper
        height={Number(containerStyle.minHeight) - (headerLayout?.height ?? 0)}>
        {emptyComponent}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [containerStyle.minHeight, emptyComponent, headerLayout?.height])

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderLayout(e.nativeEvent.layout)
  }, [])

  const renderHeader = useCallback(() => {
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
  }, [onHeaderLayout, filter, sort, view, handleManageList])

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
