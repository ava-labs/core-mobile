import { SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useMemo } from 'react'
import { Dimensions, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { MarketType } from 'store/watchlist/types'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const MarketScreen = ({
  goToMarketDetail,
  containerStyle
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  containerStyle: ViewStyle
}): JSX.Element => {
  const {
    topTokens,
    prices,
    charts,
    isRefetchingTopTokens,
    isLoadingTopTokens,
    refetchTopTokens
  } = useWatchlist()

  const { data, sort, view } = useTrackSortAndView(topTokens, prices, false)

  const emptyComponent = useMemo(() => {
    if (isRefetchingTopTokens) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
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
  }, [isRefetchingTopTokens, refetchTopTokens])

  if (isLoadingTopTokens) {
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
        containerStyle={containerStyle}
      />
    </Animated.View>
  )
}

const contentHeight = Dimensions.get('window').height / 2

export default MarketScreen
