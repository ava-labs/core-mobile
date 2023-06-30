import React from 'react'
import { StyleSheet, View } from 'react-native'
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
  Prices,
  reorderFavorites
} from 'store/watchlist'
import { DragEndParams } from 'components/draggableList/types'
import DraggableList from 'components/draggableList/DraggableList'
import BigList from 'components/BigList'
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

  function renderItem(token: MarketToken, index: number) {
    const chartData = charts[token.id] ?? defaultChartData
    const price = prices[token.id] ?? defaultPrice
    const displayValue = getDisplayValue(price, tokenInCurrencyFormatter)

    const isFirstItem = index === 0

    return (
      <View style={styles.item} key={token.id}>
        {!isFirstItem && <SeparatorComponent />}
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
        />
      </View>
    )
  }

  const EmptyComponent =
    isShowingFavorites && !isSearching ? (
      <ZeroState.NoWatchlistFavorites exploreAllTokens={onExploreAllTokens} />
    ) : (
      <ZeroState.NoResultsTextual
        message={
          'There are no tokens that match your search. Please try again.'
        }
      />
    )

  if (isShowingFavorites) {
    return (
      <DraggableList
        data={tokens || []}
        keyExtractor={keyExtractor}
        renderItem={item => renderItem(item.item, item.index)}
        onDragEnd={(params: DragEndParams<MarketToken>) => {
          const favIds = params.newListOrder.map(item => item.id)
          dispatch(reorderFavorites(favIds))
        }}
        ListEmptyComponent={EmptyComponent}
      />
    )
  }

  return (
    <BigList
      isDraggable={isShowingFavorites}
      data={tokens}
      renderItem={item => renderItem(item.item, item.index)}
      ListEmptyComponent={EmptyComponent}
      refreshing={false}
      onRefresh={() => dispatch(onWatchlistRefresh)}
      keyExtractor={keyExtractor}
      estimatedItemSize={64}
    />
  )
}

const SeparatorComponent = () => (
  <Separator style={styles.separator} inset={8} />
)

const styles = StyleSheet.create({
  separator: { backgroundColor: '#323232', height: 0.5 },
  item: { flex: 1 }
})

export default React.memo(WatchList)
