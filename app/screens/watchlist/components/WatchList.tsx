import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ListRenderItemInfo as FlashListRenderItemInfo } from '@shopify/flash-list'
import WatchListItem from 'screens/watchlist/components/WatchListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { TabsScreenProps } from 'navigation/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import ZeroState from 'components/ZeroState'
import { useDispatch } from 'react-redux'
import {
  Charts,
  defaultChartData,
  defaultPrice,
  MarketToken,
  onWatchlistRefresh,
  PriceData,
  Prices
} from 'store/watchlist'
import AvaList from 'components/AvaList'
import { DraggableListRenderItemInfo } from 'components/draggableList/DraggableList'
import { WatchlistFilter } from '../types'

const getDisplayValue = (
  price: PriceData,
  currencyFormatter: (num: number | string) => string
) => {
  const priceInCurrency = price.priceInCurrency
  return currencyFormatter(priceInCurrency)
}

interface Props {
  tokens: MarketToken[]
  prices: Prices
  charts: Charts
  filterBy: WatchlistFilter
  isShowingFavorites?: boolean
  isSearching?: boolean
  onExploreAllTokens?: () => void
  testID?: string
}

type NavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Watchlist
>['navigation']

const WatchList: React.FC<Props> = ({
  tokens,
  prices,
  charts,
  filterBy,
  isShowingFavorites,
  isSearching,
  onExploreAllTokens
}) => {
  const navigation = useNavigation<NavigationProp>()
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook
  const dispatch = useDispatch()

  const keyExtractor = (item: MarketToken) => item.id

  const draggableListItem = (
    item: DraggableListRenderItemInfo<MarketToken>
  ) => {
    return renderItem(item.item, item.drag, item.isActive)
  }

  const flashListRenderItem = (item: FlashListRenderItemInfo<MarketToken>) => {
    return renderItem(item.item)
  }

  function renderItem(
    token: MarketToken,
    drag?: () => void,
    isDragging?: boolean
  ) {
    const chartData = charts[token.id] ?? defaultChartData
    const price = prices[token.id] ?? defaultPrice
    const displayValue = getDisplayValue(price, tokenInCurrencyFormatter)

    return (
      <View
        style={
          isDragging && {
            elevation: 10,
            backgroundColor: 'black',
            shadowColor: 'white',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 6
          }
        }>
        <WatchListItem
          token={token}
          chartData={chartData}
          value={displayValue}
          filterBy={filterBy}
          testID={`watchlist_item__${token.symbol}`}
          onPress={() => {
            navigation.navigate(AppNavigation.Wallet.TokenDetail, {
              tokenId: token.id
            })
          }}
          onDragPress={drag}
        />
      </View>
    )
  }

  return (
    <AvaList
      isDraggable={isShowingFavorites}
      data={tokens}
      flashRenderItem={flashListRenderItem}
      draggableListItem={draggableListItem}
      // onDragEnd={(reOrderedFavorites: DragEndParams<MarketToken>) => {
      //   const favIds = reOrderedFavorites.data.map(item => item.id)
      //   dispatch(reorderFavorites(favIds))
      // }}
      ItemSeparatorComponent={SeparatorComponent}
      ListEmptyComponent={
        isShowingFavorites && !isSearching ? (
          <ZeroState.NoWatchlistFavorites
            exploreAllTokens={onExploreAllTokens}
          />
        ) : (
          <ZeroState.NoResultsTextual
            message={
              'There are no tokens that match your search. Please try again.'
            }
          />
        )
      }
      refreshing={false}
      onRefresh={() => dispatch(onWatchlistRefresh)}
      keyExtractor={keyExtractor}
      estimatedItemSize={64}
      extraData={{
        filterBy
      }}
    />
  )
}

const SeparatorComponent = () => (
  <Separator style={styles.separator} inset={8} />
)

const styles = StyleSheet.create({
  separator: { backgroundColor: '#323232', height: 0.5 }
})

export default React.memo(WatchList)
