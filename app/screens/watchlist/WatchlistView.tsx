import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import {
  selectIsLoadingBalances,
  selectTokensWithBalance,
  TokenWithBalance
} from 'store/balance'
import { selectWatchlistFavorites } from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { FilterTimeOptions, WatchlistFilter } from './types'
import WatchList from './components/WatchList'
import { WatchListLoader } from './components/WatchListLoader'

interface Props {
  showFavorites?: boolean
  searchText?: string
}

const filterPriceOptions = [
  WatchlistFilter.PRICE,
  WatchlistFilter.MARKET_CAP,
  WatchlistFilter.VOLUME,
  WatchlistFilter.GAINERS,
  WatchlistFilter.LOSERS
]

const filterTimeOptions = [
  FilterTimeOptions.Day,
  FilterTimeOptions.Week,
  FilterTimeOptions.Year
]

const SelectionItem = ({ title }: { title: string }) => {
  const theme = useApplicationContext().theme

  return (
    <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
      {title}
    </AvaText.ButtonSmall>
  )
}

const renderPriceFilterSelection = (selectedItem: WatchlistFilter) => (
  <SelectionItem title={`Sort by: ${selectedItem}`} />
)

const renderTimeFilterSelection = (selectedItem: FilterTimeOptions) => (
  <SelectionItem title={selectedItem} />
)

const WatchlistView: React.FC<Props> = ({ showFavorites, searchText }) => {
  const watchlistFavorites = useFocusedSelector(selectWatchlistFavorites)
  const tokensWithBalance = useFocusedSelector(selectTokensWithBalance)
  const isLoadingBalances = useFocusedSelector(selectIsLoadingBalances)
  const [filterBy, setFilterBy] = useState(WatchlistFilter.PRICE)
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

  const selectedPriceFilter = filterPriceOptions.findIndex(
    item => item === filterBy
  )

  const selectedTimeFilter = filterTimeOptions.findIndex(
    item => item === filterTime
  )

  return (
    <SafeAreaProvider style={styles.container}>
      <>
        <View style={styles.filterContainer}>
          <Dropdown
            alignment={'flex-start'}
            width={140}
            data={filterPriceOptions}
            selectedIndex={selectedPriceFilter}
            onItemSelected={setFilterBy}
            selectionRenderItem={renderPriceFilterSelection}
          />
          <Dropdown
            alignment={'flex-end'}
            width={80}
            data={filterTimeOptions}
            selectedIndex={selectedTimeFilter}
            onItemSelected={setFilterTime}
            selectionRenderItem={renderTimeFilterSelection}
          />
        </View>
        {isLoadingBalances ? (
          <WatchListLoader />
        ) : (
          <WatchList
            tokens={tokens}
            filterBy={filterBy}
            filterTimeDays={filterTimeDays}
          />
        )}
      </>
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
