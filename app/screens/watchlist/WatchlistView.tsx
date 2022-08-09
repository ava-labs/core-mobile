import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import {
  appendWatchlist,
  MarketToken,
  selectWatchlistFavorites,
  selectWatchlistTokens
} from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import watchlistService from 'services/watchlist/WatchlistService'
import { useDispatch } from 'react-redux'
import { selectIsLoadingBalances } from 'store/balance'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { FilterTimeOptions, WatchlistFilter } from './types'
import WatchList from './components/WatchList'

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
  const tokensWithBalance = useFocusedSelector(selectWatchlistTokens)
  const dispatch = useDispatch()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [filterBy, setFilterBy] = useState(WatchlistFilter.MARKET_CAP)
  const isLoadingBalances = useFocusedSelector(selectIsLoadingBalances)
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
  const [tokens, setTokens] = useState<MarketToken[]>([])

  useEffect(() => {
    async function loadAsync() {
      let items: MarketToken[] = tokensWithBalance

      if (showFavorites) {
        items = watchlistFavorites // items.filter(tk => watchlistFavorites.includes(tk.id))
      }

      if (searchText && searchText.length > 0) {
        items = items.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )

        if (items.length === 0) {
          setLoadingSearch(true)
          const onlineItems = await watchlistService.tokenSearch(searchText)
          if (onlineItems && onlineItems.length > 0) {
            items = onlineItems
            dispatch(appendWatchlist(onlineItems))
          }
          setLoadingSearch(false)
        }
      }

      setTokens(
        items.slice().sort((a, b) => {
          if (filterBy === WatchlistFilter.PRICE) {
            return b.priceInCurrency - a.priceInCurrency
          } else if (filterBy === WatchlistFilter.MARKET_CAP) {
            return b.marketCap - a.marketCap
          } else {
            return b.vol24 - a.vol24
          }
        })
      )
    }
    loadAsync()
  }, [
    tokensWithBalance,
    showFavorites,
    searchText,
    watchlistFavorites,
    filterBy,
    dispatch
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
        {isLoadingBalances || loadingSearch ? (
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
