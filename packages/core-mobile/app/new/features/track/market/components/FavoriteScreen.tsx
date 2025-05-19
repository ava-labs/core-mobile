import { Image, SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useMemo } from 'react'
import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { MarketType } from 'store/watchlist/types'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const errorIcon = require('../../../../assets/icons/star_struck_emoji.png')

const FavoriteScreen = ({
  goToMarketDetail
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
}): JSX.Element => {
  const { favorites, prices, charts, isLoadingFavorites } = useWatchlist()

  const { data, sort, view } = useTrackSortAndView(favorites, prices)

  const emptyComponent = useMemo(() => {
    return (
      <ErrorState
        sx={{ height: contentHeight }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No favorite tokens"
        description="Star any token to add it to this screen"
      />
    )
  }, [])

  if (isLoadingFavorites) {
    return <LoadingState sx={{ height: portfolioTabContentHeight * 1.5 }} />
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <MarketTokensScreen
        data={data}
        charts={charts}
        sort={sort}
        view={view}
        goToMarketDetail={goToMarketDetail}
        emptyComponent={emptyComponent}
      />
    </Animated.View>
  )
}

const contentHeight = Dimensions.get('window').height / 2

export default FavoriteScreen
