import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native'
import Loader from 'components/Loader'
import WatchListItem from 'screens/watchlist/components/WatchListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { TabsScreenProps } from 'navigation/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import ZeroState from 'components/ZeroState'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import { selectTokensWithBalance, TokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectWatchlistFavorites } from 'store/watchlist'

interface Props {
  showFavorites?: boolean
  searchText?: string
}

export enum WatchlistFilter {
  PRICE = 'Price',
  MARKET_CAP = 'Market Cap',
  VOLUME = 'Volume',
  GAINERS = 'Gainers',
  LOSERS = 'Losers'
}

const filterPriceOptions = [
  WatchlistFilter.PRICE,
  WatchlistFilter.MARKET_CAP,
  WatchlistFilter.VOLUME,
  WatchlistFilter.GAINERS,
  WatchlistFilter.LOSERS
]

enum FilterTimeOptions {
  Day = '1D',
  Week = '1W',
  Year = '1Y'
}

const filterTimeOptions = [
  FilterTimeOptions.Day,
  FilterTimeOptions.Week,
  FilterTimeOptions.Year
]

type NavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Watchlist
>['navigation']

const WatchlistView: React.FC<Props> = ({ showFavorites, searchText }) => {
  const navigation = useNavigation<NavigationProp>()
  const theme = useApplicationContext().theme
  const { currencyFormatter } = useApplicationContext().appHook
  const watchlistFavorites = useSelector(selectWatchlistFavorites)
  const tokensWithBalance = useSelector(selectTokensWithBalance)
  const [filterBy, setFilterBy] = useState(WatchlistFilter.PRICE)
  // filter time needs implementation
  const [filterTime, setFilterTime] = useState(FilterTimeOptions.Day)
  const filterTimeDays = useMemo(() => {
    switch (filterTime) {
      case FilterTimeOptions.Day:
        return 1
      case FilterTimeOptions.Week:
        return 7
      case FilterTimeOptions.Year:
        return 365
    }
  }, [filterTime])

  const tokens = useMemo(() => {
    let items: TokenWithBalance[] = tokensWithBalance

    if (showFavorites) {
      items = items.filter(tk => watchlistFavorites.includes(tk.id))
    }

    if (searchText && searchText.length > 0) {
      items = items.filter(
        i =>
          i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          i.symbol?.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    return items.slice().sort((a, b) => {
      if (filterBy === WatchlistFilter.PRICE) {
        return b.priceInCurrency - a.priceInCurrency
      } else if (filterBy === WatchlistFilter.MARKET_CAP) {
        return b.marketCap - a.marketCap
      } else {
        return b.vol24 - a.vol24
      }
    })
  }, [
    tokensWithBalance,
    showFavorites,
    searchText,
    watchlistFavorites,
    filterBy
  ])

  useEffect(() => {
    if (!showFavorites) {
      // setSearchText(searchText ?? '');
    }
  }, [searchText])

  const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
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
          : currencyFormatter(token.marketCap ?? 0, 3)
      } else if (filterBy === WatchlistFilter.VOLUME) {
        return token.vol24 === 0 ? ' -' : currencyFormatter(token.vol24 ?? 0, 1)
      }
    }

    // rank is currently not displayed because an additional
    // API call that returns a large data set would need to be made only
    // to get that information
    return (
      <WatchListItem
        token={token}
        chartDays={filterTimeDays}
        value={getDisplayValue()}
        filterBy={filterBy}
        // rank={!showFavorites ? item.index + 1 : undefined}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            tokenId: token.id
          })
        }}
      />
    )
  }

  const selectedPriceFilter = filterPriceOptions.findIndex(
    item => item === filterBy
  )

  const selectedTimeFilter = filterTimeOptions.findIndex(
    item => item === filterTime
  )

  return (
    <SafeAreaProvider style={styles.container}>
      {!tokens ? (
        <Loader />
      ) : (
        <>
          <View style={styles.filterContainer}>
            <Dropdown
              alignment={'flex-start'}
              width={140}
              data={filterPriceOptions}
              selectedIndex={selectedPriceFilter}
              onItemSelected={selectedItem => setFilterBy(selectedItem)}
              selectionRenderItem={selectedItem => (
                <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
                  Sort by: {selectedItem}
                </AvaText.ButtonSmall>
              )}
            />
            <Dropdown
              alignment={'flex-end'}
              width={80}
              data={filterTimeOptions}
              selectedIndex={selectedTimeFilter}
              onItemSelected={selectedItem => setFilterTime(selectedItem)}
              selectionRenderItem={selectedItem => (
                <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
                  {selectedItem}
                </AvaText.ButtonSmall>
              )}
            />
          </View>
          <FlatList
            data={tokens}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <Separator
                style={{ backgroundColor: '#323232', height: 0.5 }}
                inset={8}
              />
            )}
            ListEmptyComponent={<ZeroState.NoResultsTextual />}
            refreshing={false}
            keyExtractor={(item: TokenWithBalance) => item.id}
          />
        </>
      )}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  searchBackground: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'center',
    paddingStart: 12
  },
  searchInput: {
    paddingLeft: 4,
    height: 40,
    flex: 1,
    marginRight: 24,
    fontSize: 16
  }
})

export default WatchlistView
