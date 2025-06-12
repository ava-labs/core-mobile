import { Image, IndexPath, SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated, { SharedValue } from 'react-native-reanimated'
import { MarketType } from 'store/watchlist/types'
import { useMigrateFavoriteIds } from '../hooks/useMigrateFavoriteIds'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const errorIcon = require('../../../../assets/icons/star_struck_emoji.png')

const FavoriteScreen = ({
  goToMarketDetail,
  containerStyle,
  onScrollResync,
  bottomOffset
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  containerStyle: ViewStyle
  onScrollResync: () => void
  bottomOffset: SharedValue<number>
}): JSX.Element => {
  const { favorites, prices, charts, isLoadingFavorites } = useWatchlist()
  const { hasMigratedFavoriteIds } = useMigrateFavoriteIds()

  const { data, sort, view } = useTrackSortAndView(favorites, prices, true)

  const emptyComponent = useMemo(() => {
    return (
      <CollapsibleTabs.ContentWrapper
        bottomOffset={bottomOffset}
        height={Number(containerStyle.minHeight)}>
        <ErrorState
          icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
          title="No favorite tokens"
          description="Star any token to add it to this screen"
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [bottomOffset, containerStyle.minHeight])

  if (isLoadingFavorites || !hasMigratedFavoriteIds) {
    return (
      <CollapsibleTabs.ContentWrapper
        bottomOffset={bottomOffset}
        height={Number(containerStyle.minHeight)}>
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

export default FavoriteScreen
