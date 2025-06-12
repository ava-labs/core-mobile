import { Image, IndexPath } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useTokenSearch } from 'common/hooks/useTokenSearch'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { MarketType } from 'store/watchlist/types'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const magnifyingGlassIcon = require('../../../../assets/icons/magnifying_glass.png')
const cactusIcon = require('../../../../assets/icons/cactus.png')

const SearchResultScreen = ({
  searchText,
  goToMarketDetail,
  isSearchBarFocused,
  containerStyle,
  handleScrollResync,
  bottomOffset
}: {
  searchText: string
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  isSearchBarFocused: boolean
  containerStyle: ViewStyle
  handleScrollResync: () => void
  bottomOffset: SharedValue<number>
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
    pricesToDisplay,
    false
  )

  const emptyComponent = useMemo(() => {
    if (isSearchingTokens || isLoadingTopTokens || isLoadingTrendingTokens) {
      return (
        <CollapsibleTabs.ContentWrapper
          bottomOffset={bottomOffset}
          height={Number(containerStyle.minHeight)}>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    return (
      <CollapsibleTabs.ContentWrapper
        bottomOffset={bottomOffset}
        height={Number(containerStyle.minHeight)}>
        <ErrorState
          icon={
            <Image
              source={isFocused ? magnifyingGlassIcon : cactusIcon}
              sx={{
                width: 42,
                height: 42
              }}
            />
          }
          title={
            isFocused
              ? 'Find tokens by name,\nsymbol or address'
              : 'No results found'
          }
          description=""
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [
    bottomOffset,
    containerStyle.minHeight,
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
      view={{
        ...view,
        onSelected: (indexPath: IndexPath) => {
          handleScrollResync()
          view.onSelected(indexPath)
        }
      }}
      goToMarketDetail={goToMarketDetail}
      emptyComponent={emptyComponent}
      containerStyle={containerStyle}
    />
  )
}

export default SearchResultScreen
