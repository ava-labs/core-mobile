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
import { MarketToken, onWatchlistRefresh } from 'store/watchlist'
import { formatLargeCurrency } from 'utils/Utils'
import { WatchlistFilter } from '../types'

interface Props {
  tokens: MarketToken[]
  filterBy: WatchlistFilter
  filterTimeDays: number
  isShowingFavorites?: boolean
  isSearching?: boolean
}

type NavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Watchlist
>['navigation']

const WatchList: React.FC<Props> = ({
  tokens,
  filterBy,
  filterTimeDays,
  isShowingFavorites,
  isSearching
}) => {
  const navigation = useNavigation<NavigationProp>()
  const { currencyFormatter } = useApplicationContext().appHook
  const dispatch = useDispatch()

  const keyExtractor = (item: MarketToken) => item.id

  const renderItem = (item: ListRenderItemInfo<MarketToken>) => {
    const token = item.item

    function getDisplayValue() {
      if (filterBy === WatchlistFilter.PRICE) {
        const priceInCurrency = token.priceInCurrency
        return priceInCurrency === 0
          ? ' -'
          : priceInCurrency > 0 && priceInCurrency < 0.1
          ? `${priceInCurrency.toFixed(6)}`
          : currencyFormatter(priceInCurrency)
      } else if (filterBy === WatchlistFilter.MARKET_CAP) {
        return token.marketCap === 0
          ? ' -'
          : formatLargeCurrency(currencyFormatter(token.marketCap ?? 0), 3)
      } else if (filterBy === WatchlistFilter.VOLUME) {
        return token.vol24 === 0
          ? ' -'
          : formatLargeCurrency(currencyFormatter(token.vol24 ?? 0), 1)
      }
    }

    return (
      <WatchListItem
        token={token}
        chartDays={filterTimeDays}
        value={getDisplayValue()}
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
        filterTimeDays,
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
