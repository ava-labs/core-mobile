import { SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { ErrorState } from 'new/common/components/ErrorState'
import { LoadingState } from 'new/common/components/LoadingState'
import React, { useMemo } from 'react'
import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { MarketType } from 'store/watchlist/types'
import { useIsSwapListLoaded } from 'common/hooks/useIsSwapListLoaded'
import TrendingTokensScreen from './TrendingTokensScreen'

export const TrendingScreen = ({
  goToMarketDetail
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
}): JSX.Element => {
  const {
    trendingTokens,
    isLoadingTrendingTokens,
    isRefetchingTrendingTokens,
    refetchTrendingTokens
  } = useWatchlist()

  const isSwapListLoaded = useIsSwapListLoaded()

  const emptyComponent = useMemo(() => {
    if (isRefetchingTrendingTokens) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    return (
      <ErrorState
        sx={{ height: contentHeight }}
        button={{
          title: 'Refresh',
          onPress: refetchTrendingTokens
        }}
      />
    )
  }, [isRefetchingTrendingTokens, refetchTrendingTokens])

  const showLoading =
    isLoadingTrendingTokens ||
    // each token's swapability depends on the swap list
    // thus, we need to wait for the swap list to load
    // so that we can display the buy button accordingly
    !isSwapListLoaded

  if (showLoading) {
    return <LoadingState sx={{ height: portfolioTabContentHeight * 1.5 }} />
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <TrendingTokensScreen
        data={trendingTokens}
        goToMarketDetail={goToMarketDetail}
        emptyComponent={emptyComponent}
      />
    </Animated.View>
  )
}

const contentHeight = Dimensions.get('window').height / 2
