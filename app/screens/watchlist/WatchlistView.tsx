import React, { Dispatch, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import AvaText from 'components/AvaText'
import {
  MarketToken,
  selectWatchlistFavorites,
  selectWatchlistTokens,
  selectWatchlistCharts,
  selectWatchlistPrices,
  setPrices,
  setCharts,
  appendTokens,
  defaultPrice,
  defaultChartData
} from 'store/watchlist'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import watchlistService from 'services/watchlist/WatchlistService'
import { useDispatch } from 'react-redux'
import { WatchListLoader } from 'screens/watchlist/components/WatchListLoader'
import isEmpty from 'lodash.isempty'
import { selectSelectedCurrency } from 'store/settings/currency'
import { ChartData } from 'services/token/types'
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

const WatchlistView: React.FC<Props> = ({
  showFavorites,
  searchText,
  onTabIndexChanged
}) => {
  const favorites = useFocusedSelector(selectWatchlistFavorites)
  const tokens = useFocusedSelector(selectWatchlistTokens)
  const prices = useFocusedSelector(selectWatchlistPrices)
  const charts = useFocusedSelector(selectWatchlistCharts)
  const currency = useFocusedSelector(selectSelectedCurrency).toLowerCase()
  const dispatch = useDispatch()
  const [isSearchingTokens, setIsSearchingTokens] = useState(false)
  const [filterBy, setFilterBy] = useState(WatchlistFilter.MARKET_CAP)
  const [tokensToDisplay, setTokensToDisplay] = useState<MarketToken[]>([])
  const isSearching = !isEmpty(searchText)

  // favorites are loaded locally. e only show loader if we query
  // coingecko when searching OR if we're NOT on
  // the favorites tab and tokens are empty
  const isFetchingTokens = tokens.length === 0
  const showLoader = isSearchingTokens || (!showFavorites && isFetchingTokens)

  useEffect(() => {
    async function loadAsync() {
      if (isFetchingTokens) return

      let items: MarketToken[] = tokens

      if (showFavorites) {
        items = favorites
      }

      if (searchText && searchText.length > 0) {
        items = items.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase())
        )

        if (items.length === 0) {
          setIsSearchingTokens(true)

          const searchResult = await watchlistService.tokenSearch(
            searchText,
            currency
          )

          if (searchResult) {
            items = searchResult.tokens

            // save results to the list
            dispatch(appendTokens(searchResult.tokens))

            // also save prices and charts data so we can reuse them in the Favorites tab
            dispatch(setPrices(searchResult.prices))
            dispatch(setCharts(searchResult.charts))
          }

          setIsSearchingTokens(false)
        }
      }
      setTokensToDisplay(items)
    }
    loadAsync()
  }, [
    showFavorites,
    searchText,
    currency,
    filterBy,
    dispatch,
    tokens,
    isFetchingTokens,
    favorites
  ])

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
      {!showFavorites && (
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
      )}
      {showLoader ? (
        <WatchListLoader />
      ) : (
        <>
          <WatchList
            tokens={showFavorites ? tokensToDisplay : sortedTokens}
            charts={charts}
            prices={prices}
            filterBy={filterBy}
            isShowingFavorites={showFavorites}
            isSearching={isSearching}
            onExploreAllTokens={() => onTabIndexChanged?.(1)}
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
