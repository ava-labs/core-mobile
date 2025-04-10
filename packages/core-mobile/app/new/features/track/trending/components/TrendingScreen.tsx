import React, { useMemo } from 'react'
import { Dimensions } from 'react-native'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LoadingState } from 'new/common/components/LoadingState'
import { ErrorState } from 'new/common/components/ErrorState'
import TrendingTokensScreen from './TrendingTokensScreen'

export const TrendingScreen = ({
  goToMarketDetail
}: {
  goToMarketDetail: (tokenId: string) => void
}): JSX.Element => {
  const {
    trendingTokens,
    isLoadingTrendingTokens,
    isRefetchingTrendingTokens,
    refetchTrendingTokens
  } = useWatchlist()

  const emptyComponent = useMemo(() => {
    if (isLoadingTrendingTokens || isRefetchingTrendingTokens) {
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
  }, [
    isLoadingTrendingTokens,
    isRefetchingTrendingTokens,
    refetchTrendingTokens
  ])

  return (
    <TrendingTokensScreen
      data={trendingTokens}
      goToMarketDetail={goToMarketDetail}
      emptyComponent={emptyComponent}
    />
  )
}

const contentHeight = Dimensions.get('window').height / 2
