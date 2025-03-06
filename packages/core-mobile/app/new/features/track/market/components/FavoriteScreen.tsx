import React, { useMemo } from 'react'
import { Image } from '@avalabs/k2-alpine'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { LoadingState } from 'common/components/LoadingState'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { ErrorState } from 'common/components/ErrorState'
import { Dimensions } from 'react-native'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import TrackScreen from './TrackScreen'

const FavoriteScreen = ({
  goToMarketDetail,
  searchText
}: {
  goToMarketDetail: (tokenId: string) => void
  searchText: string
}): JSX.Element => {
  const {
    favorites,
    prices,
    charts,
    isRefetchingTopTokens,
    isLoadingTopTokens
  } = useWatchlist()

  const searchResults = useMemo(() => {
    if (searchText && searchText.length > 0) {
      return favorites.filter(
        i =>
          i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          i.symbol?.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return favorites
  }, [favorites, searchText])

  const tokensToDisplay = useMemo(() => {
    return searchResults ?? favorites
  }, [favorites, searchResults])

  const { data, sort, view } = useTrackSortAndView(tokensToDisplay, prices)

  const emptyComponent = useMemo(() => {
    if (isLoadingTopTokens || isRefetchingTopTokens) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (searchText && searchText.length > 0) {
      return (
        <ErrorState
          sx={{ height: contentHeight }}
          icon={
            <Image
              source={require('../../../../assets/icons/cactus.png')}
              sx={{ width: 42, height: 42 }}
            />
          }
          title="No results found"
          description=""
        />
      )
    }

    return (
      <ErrorState
        sx={{ height: contentHeight }}
        icon={
          <Image
            source={require('../../../../assets/icons/star_struck_emoji.png')}
            sx={{ width: 42, height: 42 }}
          />
        }
        title="No favorite tokens"
        description="Star any token to add it to this screen"
      />
    )
  }, [isLoadingTopTokens, isRefetchingTopTokens, searchText])

  return (
    <TrackScreen
      data={data}
      charts={charts}
      sort={sort}
      view={view}
      goToMarketDetail={goToMarketDetail}
      emptyComponent={emptyComponent}
    />
  )
}

const contentHeight = Dimensions.get('window').height / 2

export default FavoriteScreen
