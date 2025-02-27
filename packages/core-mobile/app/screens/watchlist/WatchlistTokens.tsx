import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import {
  MarketToken,
  Prices,
  Charts,
  defaultPrice
} from 'store/watchlist/types'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import { useTokenSearch } from 'screens/watchlist/useTokenSearch'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useWatchlistContext } from 'contexts/WatchlistContext'
import { WatchlistFilter } from './types'
import WatchList from './components/WatchList'
import { WatchListType } from './types'

const comparePercentChange = (
  token1: MarketToken,
  token2: MarketToken
): number => {
  const percentChange1 = token1.priceChangePercentage24h ?? 0
  const percentChange2 = token2.priceChangePercentage24h ?? 0

  return percentChange1 - percentChange2
}

const filterPriceOptions = [
  WatchlistFilter.PRICE,
  WatchlistFilter.MARKET_CAP,
  WatchlistFilter.VOLUME,
  WatchlistFilter.GAINERS,
  WatchlistFilter.LOSERS
]

const SelectionItem = ({
  title,
  testID
}: {
  title: string
  testID?: string
}): JSX.Element => {
  const theme = useApplicationContext().theme

  return (
    <AvaText.ButtonSmall
      testID={testID}
      textStyle={{ color: theme.colorText1 }}>
      {title}
    </AvaText.ButtonSmall>
  )
}

const renderPriceFilterSelection = (
  selectedItem: WatchlistFilter
): JSX.Element => (
  <SelectionItem
    testID="watchlist_sort_svg"
    title={`Sort by: ${selectedItem}`}
  />
)

export const WatchlistTokens = (): React.JSX.Element => {
  const {
    topTokens: tokens,
    prices,
    charts,
    isLoadingTopTokens
  } = useWatchlist()
  const [filterBy, setFilterBy] = useState(WatchlistFilter.MARKET_CAP)

  const isFetchingTokens = tokens.length === 0 && isLoadingTopTokens

  return (
    <WatchlistUI
      type={WatchListType.TOP}
      tokens={tokens}
      prices={prices}
      charts={charts}
      filterBy={filterBy}
      setFilterBy={setFilterBy}
      isFetching={isFetchingTokens}
    />
  )
}

export const TokenSearchResults = (): React.JSX.Element => {
  const { searchText } = useWatchlistContext()
  const { allTokens, prices, charts } = useWatchlist()
  const [filterBy, setFilterBy] = useState(WatchlistFilter.MARKET_CAP)

  const isFetchingTokens = allTokens.length === 0

  const { isSearchingTokens, searchResults } = useTokenSearch({
    isFetchingTokens,
    items: allTokens,
    searchText
  })

  return (
    <WatchlistUI
      type={WatchListType.SEARCH}
      tokens={searchResults?.tokens ?? []}
      prices={searchResults?.prices ?? prices}
      charts={searchResults?.charts ?? charts}
      filterBy={filterBy}
      setFilterBy={setFilterBy}
      isFetching={isFetchingTokens || isSearchingTokens}
    />
  )
}

const WatchlistUI = ({
  type,
  tokens,
  prices,
  charts,
  filterBy,
  setFilterBy,
  isFetching
}: {
  type: WatchListType
  tokens: MarketToken[]
  prices: Prices
  charts: Charts
  filterBy: WatchlistFilter
  setFilterBy: (filter: WatchlistFilter) => void
  isFetching: boolean
}): React.JSX.Element => {
  const sortedTokens = useMemo(() => {
    if (Object.keys(prices).length === 0) return tokens

    return tokens.slice().sort((a, b) => {
      const priceB = prices[b.id] ?? defaultPrice
      const priceA = prices[a.id] ?? defaultPrice

      switch (filterBy) {
        case WatchlistFilter.MARKET_CAP:
          return priceB.marketCap - priceA.marketCap
        case WatchlistFilter.VOLUME:
          return priceB.vol24 - priceA.vol24
        case WatchlistFilter.GAINERS:
          return comparePercentChange(b, a)
        case WatchlistFilter.LOSERS:
          return comparePercentChange(a, b)
        case WatchlistFilter.PRICE:
        default:
          return priceB.priceInCurrency - priceA.priceInCurrency
      }
    })
  }, [filterBy, prices, tokens])

  const selectedPriceFilter = filterPriceOptions.findIndex(
    item => item === filterBy
  )

  return (
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
      </View>
      {isFetching ? (
        <WatchListLoader />
      ) : (
        <WatchList
          type={type}
          tokens={sortedTokens}
          charts={charts}
          prices={prices}
          testID="watchlist_item"
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
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
