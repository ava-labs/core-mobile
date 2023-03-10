import React, { Dispatch, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import {
  defaultChartData,
  defaultPrice,
  selectWatchlistCharts,
  selectWatchlistPrices,
  selectWatchlistTokens
} from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import isEmpty from 'lodash.isempty'
import { selectSelectedCurrency } from 'store/settings/currency'
import { ChartData } from 'services/token/types'
import { useTokenSearch } from 'screens/watchlist/useTokenSearch'
import { WatchlistFilter } from './types'
import WatchList from './components/WatchList'

const comparePercentChange = (chartData1: ChartData, chartData2: ChartData) => {
  const percentChange1 =
    Math.sign(chartData1.ranges.diffValue) * chartData1.ranges.percentChange
  const percentChange2 =
    Math.sign(chartData2.ranges.diffValue) * chartData2.ranges.percentChange

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

const WatchlistView: React.FC<Props> = ({ searchText }) => {
  const tokens = useFocusedSelector(selectWatchlistTokens)
  const prices = useFocusedSelector(selectWatchlistPrices)
  const charts = useFocusedSelector(selectWatchlistCharts)
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
    return searchResults ? searchResults : tokens
  }, [searchResults, tokens])

  const sortedTokens = useMemo(() => {
    if (Object.keys(prices).length === 0) return tokensToDisplay

    return tokensToDisplay.slice().sort((a, b) => {
      const priceB = prices[b.id] ?? defaultPrice
      const chartB = charts[b.id] ?? defaultChartData
      const priceA = prices[a.id] ?? defaultPrice
      const chartA = charts[a.id] ?? defaultChartData

      switch (filterBy) {
        case WatchlistFilter.MARKET_CAP:
          return priceB.marketCap - priceA.marketCap
        case WatchlistFilter.VOLUME:
          return priceB.vol24 - priceA.vol24
        case WatchlistFilter.GAINERS:
          return comparePercentChange(chartB, chartA)
        case WatchlistFilter.LOSERS:
          return comparePercentChange(chartA, chartB)
        case WatchlistFilter.PRICE:
        default:
          return priceB.priceInCurrency - priceA.priceInCurrency
      }
    })
  }, [charts, filterBy, prices, tokensToDisplay])

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
