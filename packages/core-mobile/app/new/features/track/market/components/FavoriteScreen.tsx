import React, { useMemo } from 'react'
import { Image } from '@avalabs/k2-alpine'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { LoadingState } from 'common/components/LoadingState'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { ErrorState } from 'common/components/ErrorState'
import { Dimensions } from 'react-native'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const errorIcon = require('../../../../assets/icons/star_struck_emoji.png')

const FavoriteScreen = ({
  goToMarketDetail
}: {
  goToMarketDetail: (tokenId: string) => void
}): JSX.Element => {
  const { favorites, prices, charts, isLoadingFavorites } = useWatchlist()

  const { data, sort, view } = useTrackSortAndView(favorites, prices)

  const emptyComponent = useMemo(() => {
    if (isLoadingFavorites) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    return (
      <ErrorState
        sx={{ height: contentHeight }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No favorite tokens"
        description="Star any token to add it to this screen"
      />
    )
  }, [isLoadingFavorites])

  return (
    <MarketTokensScreen
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
