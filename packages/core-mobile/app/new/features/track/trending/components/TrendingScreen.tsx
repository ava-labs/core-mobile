import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { ErrorState } from 'new/common/components/ErrorState'
import { LoadingState } from 'new/common/components/LoadingState'
import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { MarketType } from 'store/watchlist'
import TrendingTokensScreen from './TrendingTokensScreen'

export const TrendingScreen = ({
  goToMarketDetail,
  containerStyle
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  containerStyle: ViewStyle
}): JSX.Element => {
  const {
    trendingTokens,
    isLoadingTrendingTokens,
    isRefetchingTrendingTokens,
    refetchTrendingTokens
  } = useWatchlist()

  const emptyComponent = useMemo(() => {
    if (isRefetchingTrendingTokens) {
      return (
        <CollapsibleTabs.ContentWrapper>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    return (
      <CollapsibleTabs.ContentWrapper>
        <ErrorState
          button={{
            title: 'Refresh',
            onPress: refetchTrendingTokens
          }}
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [isRefetchingTrendingTokens, refetchTrendingTokens])

  const showLoading = isLoadingTrendingTokens

  if (showLoading) {
    return (
      <LoadingState
        sx={{
          minHeight: containerStyle.minHeight,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    )
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      style={{
        flex: 1
      }}>
      <TrendingTokensScreen
        data={trendingTokens}
        goToMarketDetail={goToMarketDetail}
        emptyComponent={emptyComponent}
        containerStyle={containerStyle}
      />
    </Animated.View>
  )
}
