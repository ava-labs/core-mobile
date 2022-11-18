import React from 'react'
import { StyleSheet } from 'react-native'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
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
import { formatLargeCurrency } from 'utils/Utils'
import { WatchlistFilter } from '../types'

const getDisplayValue = (
  price: PriceData,
  currencyFormatter: (num: number | string) => string
) => {
  const priceInCurrency = price.priceInCurrency

  return priceInCurrency === 0
    ? ' -'
    : priceInCurrency > 0 && priceInCurrency < 0.1
    ? `${priceInCurrency.toFixed(6)}`
    : formatLargeCurrency(currencyFormatter(priceInCurrency))
}

interface Props {
  tokens: MarketToken[]
  prices: Prices
  charts: Charts
  filterBy: WatchlistFilter
  isShowingFavorites?: boolean
  isSearching?: boolean
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
  isSearching
}) => {
  const navigation = useNavigation<NavigationProp>()
  const { currencyFormatter } = useApplicationContext().appHook
  const dispatch = useDispatch()

  const keyExtractor = (item: MarketToken) => item.id

  const renderItem = (item: ListRenderItemInfo<MarketToken>) => {
    const token = item.item
    const chartData = charts[token.id] ?? defaultChartData
    const price = prices[token.id] ?? defaultPrice
    const displayValue = getDisplayValue(price, currencyFormatter)

    return (
      <WatchListItem
        token={token}
        chartData={chartData}
        value={displayValue}
        filterBy={filterBy}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            tokenId: token.id
          })
        }}
      />
    )
  }

  return (
    <FlashList
      data={tokens}
      renderItem={renderItem}
      ItemSeparatorComponent={SeparatorComponent}
      ListEmptyComponent={
        isShowingFavorites && !isSearching ? (
          <ZeroState.NoWatchlistFavorites />
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
      indicatorStyle="white"
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
