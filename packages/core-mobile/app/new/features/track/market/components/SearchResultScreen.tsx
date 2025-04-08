import React, { useMemo } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Dimensions } from 'react-native'
import { useTokenSearch } from 'common/hooks/useTokenSearch'
import { Image } from '@avalabs/k2-alpine'
import { SEGMENT_CONTROL_HEIGHT } from 'features/portfolio/assets/consts'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const magnifyingGlassIcon = require('../../../../assets/icons/magnifying_glass.png')
const cactusIcon = require('../../../../assets/icons/cactus.png')

const SearchResultScreen = ({
  searchText,
  goToMarketDetail,
  isSearchBarFocused
}: {
  searchText: string
  goToMarketDetail: (tokenId: string) => void
  isSearchBarFocused: boolean
}): JSX.Element => {
  const {
    prices,
    charts,
    isLoadingTrendingTokens,
    isLoadingTopTokens,
    allTokens
  } = useWatchlist()

  const isFocused = isSearchBarFocused && searchText.length === 0

  const { data: searchResults, isLoading: isSearchingTokens } = useTokenSearch({
    isFetchingTokens: isLoadingTopTokens || isLoadingTrendingTokens,
    items: allTokens,
    searchText
  })

  const tokensToDisplay = useMemo(() => {
    return searchResults?.tokens ?? []
  }, [searchResults?.tokens])

  const pricesToDisplay = useMemo(() => {
    return searchResults?.prices ?? prices
  }, [searchResults?.prices, prices])

  const chartsToDisplay = useMemo(() => {
    return searchResults?.charts ?? charts
  }, [searchResults?.charts, charts])

  const { data, sort, view } = useTrackSortAndView(
    tokensToDisplay,
    pricesToDisplay
  )

  const emptyComponent = useMemo(() => {
    if (isSearchingTokens || isLoadingTopTokens || isLoadingTrendingTokens) {
      return <LoadingState sx={{ height: contentHeight }} />
    }

    return (
      <ErrorState
        sx={{ height: contentHeight }}
        icon={
          <Image
            source={isFocused ? magnifyingGlassIcon : cactusIcon}
            sx={{
              width: 42,
              height: 42
            }}
          />
        }
        title={isFocused ? 'Find tokens by name or symbol' : 'No results found'}
        description=""
      />
    )
  }, [
    isFocused,
    isLoadingTopTokens,
    isLoadingTrendingTokens,
    isSearchingTokens
  ])

  return (
    <MarketTokensScreen
      data={data}
      charts={chartsToDisplay}
      sort={sort}
      view={view}
      goToMarketDetail={goToMarketDetail}
      emptyComponent={emptyComponent}
    />
  )
}

const contentHeight =
  Dimensions.get('window').height / 2 + SEGMENT_CONTROL_HEIGHT + 16

export default SearchResultScreen
