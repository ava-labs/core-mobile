import { SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { MarketType } from 'store/watchlist'
import { MarketView, useTrackSortAndView } from '../hooks/useTrackSortAndView'
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

  const { data, sort, view } = useTrackSortAndView(topTokens, prices)
  const listType = view.selected as MarketView

  const emptyComponent = useMemo(() => {
    if (isRefetchingTopTokens) {
      return <LoadingState />
    }

    return (
      <ErrorState
        button={{
          title: 'Refresh',
          onPress: refetchTopTokens
        }}
      />
    )
  }, [isRefetchingTopTokens, refetchTopTokens])

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper>
        {emptyComponent}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [emptyComponent])

  if (isLoadingTopTokens) {
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
      <MarketTokensScreen
        key={`market-tokens-list-${listType}`}
        data={data}
        charts={charts}
        sort={sort}
        view={{
          ...view,
          onSelected: (value: string) => {
            onScrollResync()
            view.onSelected(value)
          }
        }}
        goToMarketDetail={goToMarketDetail}
        renderEmpty={renderEmpty}
        containerStyle={containerStyle}
      />
    </Animated.View>
  )
}

export default MarketScreen
