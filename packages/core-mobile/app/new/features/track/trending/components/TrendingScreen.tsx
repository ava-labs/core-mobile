import { SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { useIsSwapListLoaded } from 'common/hooks/useIsSwapListLoaded'
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

  const isSwapListLoaded = useIsSwapListLoaded()

  const emptyComponent = useMemo(() => {
    if (isRefetchingTrendingTokens) {
      return (
        <CollapsibleTabs.ContentWrapper
          height={Number(containerStyle.minHeight)}>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    return (
      <CollapsibleTabs.ContentWrapper height={Number(containerStyle.minHeight)}>
        <ErrorState
          button={{
            title: 'Refresh',
            onPress: refetchTrendingTokens
          }}
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [
    containerStyle.minHeight,
    isRefetchingTrendingTokens,
    refetchTrendingTokens
  ])

  const showLoading =
    isLoadingTrendingTokens ||
    // each token's swapability depends on the swap list
    // thus, we need to wait for the swap list to load
    // so that we can display the buy button accordingly
    !isSwapListLoaded

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
      layout={SPRING_LINEAR_TRANSITION}
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
