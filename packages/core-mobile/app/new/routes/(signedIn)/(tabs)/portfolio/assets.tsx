import React from 'react'
import {
  LocalTokenWithBalance,
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
import { useIsOnline } from 'common/hooks/useIsOnline'
import { RootState } from 'store'
import { ListFilterHeader } from 'features/portfolio/components/ListFilterHeader'
import { TokenListItem } from 'features/portfolio/components/assets/TokenListItem'
import { useFilterAndSort } from 'features/portfolio/components/assets/useFilterAndSort'
import {
  ActionButtonTitle,
  AssetManageView
} from 'features/portfolio/components/assets/consts'
import {
  ActionButton,
  TActionButton
} from 'features/portfolio/components/assets/ActionButton'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'

export const PortfolioScreen = (): React.JSX.Element => {
  const { data, filter, sort, view } = useFilterAndSort()

  const { refetch } = useSearchableTokenList()
  const isOnline = useIsOnline()
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector((state: RootState) =>
    selectNonNFTTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  const goToTokenDetail = (): void => {
    // TODO: go to token detail
  }

  const isGridView =
    view.data[0]?.[view.selected.row] === AssetManageView.Hightlights

  const renderItem = (
    token: LocalTokenWithBalance,
    index: number,
    gridView: boolean
  ): React.JSX.Element => {
    return (
      <TokenListItem
        token={token}
        index={index}
        onPress={goToTokenDetail}
        isGridView={gridView}
      />
    )
  }

  const renderActionItem = (
    item: TActionButton,
    index: number
  ): React.JSX.Element => {
    return <ActionButton item={item} index={index} key={index} />
  }

  const renderSeparator = (): React.JSX.Element => {
    return <Space y={isGridView ? 16 : 10} />
  }

  const renderContent = (): React.JSX.Element => {
    if (isBalanceLoading || isRefetchingBalance) {
      return <LoadingState />
    }

    if (!isOnline) {
      return <ErrorState onPress={refetch} />
    }

    if (tokens.length === 0) {
      return <EmptyAssets />
    }
    return (
      <>
        <ListFilterHeader filter={filter} sort={sort} view={view} />
        <Animated.FlatList
          scrollEventThrottle={16}
          data={data}
          numColumns={isGridView ? 2 : 1}
          renderItem={item =>
            renderItem(
              item.item as LocalTokenWithBalance,
              item.index,
              isGridView
            )
          }
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          key={isGridView ? 'grid' : 'list'}
          keyExtractor={item => (item as LocalTokenWithBalance).localId}
          columnWrapperStyle={
            isGridView && {
              justifyContent: 'space-between',
              gap: 16
            }
          }
        />
      </>
    )
  }

  return (
    <View sx={{ marginTop: 30 }}>
      <Animated.FlatList
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
        horizontal
        scrollEventThrottle={16}
        data={ACTION_BUTTONS}
        renderItem={item => renderActionItem(item.item, item.index)}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        itemLayoutAnimation={LinearTransition.springify()}
      />
      {renderContent()}
    </View>
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
