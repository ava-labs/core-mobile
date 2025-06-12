import { IndexPath, SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated, { SharedValue } from 'react-native-reanimated'
import { MarketType } from 'store/watchlist/types'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const MarketScreen = ({
  goToMarketDetail,
  containerStyle,
  onScrollResync
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  containerStyle: ViewStyle
  onScrollResync: () => void
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
            onPress: refetchTopTokens
          }}
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [containerStyle.minHeight, isRefetchingTopTokens, refetchTopTokens])

  if (isLoadingTopTokens) {
    return (
      <CollapsibleTabs.ContentWrapper height={Number(containerStyle.minHeight)}>
        <LoadingState />
      </CollapsibleTabs.ContentWrapper>
    )
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
        view={{
          ...view,
          onSelected: (indexPath: IndexPath) => {
            onScrollResync()
            view.onSelected(indexPath)
          }
        }}
        goToMarketDetail={goToMarketDetail}
        emptyComponent={emptyComponent}
        containerStyle={containerStyle}
      />
    </Animated.View>
  )
}

export default MarketScreen
