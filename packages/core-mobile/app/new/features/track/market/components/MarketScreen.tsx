import React, { useMemo } from 'react'
import { Image } from '@avalabs/k2-alpine'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Dimensions } from 'react-native'
import { useTokenSearch } from 'common/hooks/useTokenSearch'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import TrackScreen from './TrackScreen'

const MarketScreen = ({
  goToMarketDetail,
  searchText,
  isSearchBarFocused = false
}: {
  goToMarketDetail: (tokenId: string) => void
  searchText: string
  isSearchBarFocused?: boolean
}): JSX.Element => {
  const {
    topTokens,
    prices,
    charts,
    isRefetchingTopTokens,
    isLoadingTopTokens,
    refetchTopTokens
  } = useWatchlist()
  const { data: searchResults, isLoading: isSearchingTokens } = useTokenSearch({
    isFetchingTokens: isLoadingTopTokens || isRefetchingTopTokens,
    items: topTokens,
    searchText
  })

  const tokensToDisplay = useMemo(() => {
    if (searchResults?.tokens?.length && searchResults.tokens.length > 0) {
      return searchResults?.tokens
    }
    return isSearchBarFocused ? [] : topTokens
  }, [isSearchBarFocused, searchResults?.tokens, topTokens])

  const pricesToDisplay = useMemo(() => {
    return searchResults?.prices && Object.keys(searchResults.prices).length > 0
      ? searchResults.prices
      : prices
  }, [searchResults?.prices, prices])

  const chartsToDisplay = useMemo(() => {
    return searchResults?.charts && Object.keys(searchResults.charts).length > 0
      ? searchResults.charts
      : charts
  }, [searchResults?.charts, charts])

  const { data, sort, view } = useTrackSortAndView(
    tokensToDisplay,
    pricesToDisplay
  )

  const emptyComponent = useMemo(() => {
    if (isSearchingTokens || isLoadingTopTokens || isRefetchingTopTokens) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (isSearchBarFocused) {
      return (
        <ErrorState
          sx={{ height: contentHeight }}
          icon={
            <Image
              source={
                searchText.length === 0
                  ? require('../../../../assets/icons/magnifying_glass.png')
                  : require('../../../../assets/icons/cactus.png')
              }
              sx={{ width: 42, height: 42 }}
            />
          }
          title={
            searchText.length === 0
              ? 'Find tokens by name or symbol'
              : 'No results found'
          }
          description=""
        />
      )
    }

    return (
      <ErrorState
        sx={{ height: contentHeight }}
        button={{
          title: 'Refresh',
          onPress: refetchTopTokens
        }}
      />
    )
  }, [
    isSearchingTokens,
    isRefetchingTopTokens,
    isLoadingTopTokens,
    isSearchBarFocused,
    refetchTopTokens,
    searchText.length
  ])

  return (
    <TrackScreen
      data={data}
      charts={chartsToDisplay}
      sort={sort}
      view={view}
      goToMarketDetail={goToMarketDetail}
      emptyComponent={emptyComponent}
    />
  )
}

const contentHeight = Dimensions.get('window').height / 2

export default MarketScreen
