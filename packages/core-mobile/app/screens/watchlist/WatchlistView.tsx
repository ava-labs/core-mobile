import React, { Dispatch, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import { MarketToken, defaultPrice } from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import isEmpty from 'lodash.isempty'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useTokenSearch } from 'screens/watchlist/useTokenSearch'
import { useWatchlist } from 'hooks/useWatchlist'
import { WatchlistFilter } from './types'
import WatchList from './components/WatchList'

const comparePercentChange = (
  token1: MarketToken,
  token2: MarketToken
): number => {
  const percentChange1 = token1.priceChangePercentage24h ?? 0
  const percentChange2 = token2.priceChangePercentage24h ?? 0

  return percentChange1 - percentChange2
}

interface Props {
  showFavorites?: boolean
  searchText?: string
  onTabIndexChanged?: Dispatch<number>
  testID?: string
}

const filterPriceOptions = [
  WatchlistFilter.PRICE,
  WatchlistFilter.MARKET_CAP,
  WatchlistFilter.VOLUME,
  WatchlistFilter.GAINERS,
  WatchlistFilter.LOSERS
]

const SelectionItem = ({ title }: { title: string }): JSX.Element => {
  const theme = useApplicationContext().theme

  return (
    <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
      {title}
    </AvaText.ButtonSmall>
  )
}

const renderPriceFilterSelection = (
  selectedItem: WatchlistFilter
): JSX.Element => <SelectionItem title={`Sort by: ${selectedItem}`} />

const WatchlistView: React.FC<Props> = ({ searchText }) => {
  const { tokens, prices, charts } = useWatchlist()
  const currency = useFocusedSelector(selectSelectedCurrency).toLowerCase()
  const [filterBy, setFilterBy] = useState(WatchlistFilter.MARKET_CAP)
  const isSearching = !isEmpty(searchText)

  const isFetchingTokens = tokens.length === 0

  const { isSearchingTokens, searchResults } = useTokenSearch({
    isFetchingTokens,
    items: tokens,
    searchText,
    currency
  })
  const showLoader = isSearchingTokens || isFetchingTokens
  const tokensToDisplay = useMemo(() => {
    return searchResults ?? tokens
  }, [searchResults, tokens])

  const sortedTokens = useMemo(() => {
    if (Object.keys(prices).length === 0) return tokensToDisplay

    return tokensToDisplay.slice().sort((a, b) => {
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
  }, [filterBy, prices, tokensToDisplay])

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
      {showLoader ? (
        <WatchListLoader />
      ) : (
        <>
          <WatchList
            tokens={sortedTokens}
            charts={charts}
            prices={prices}
            filterBy={filterBy}
            isSearching={isSearching}
            testID="watchlist_item"
          />
        </>
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

export default WatchlistView
