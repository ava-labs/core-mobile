import { Image } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useFavoritesView } from 'features/track/store'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { MarketType } from 'store/watchlist'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketTokensScreen from './MarketTokensScreen'

const errorIcon = require('../../../../assets/icons/star_struck_emoji.png')

const FavoriteScreen = ({
  goToMarketDetail,
  containerStyle,
  onScrollResync
}: {
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  containerStyle: ViewStyle
  onScrollResync: () => void
}): JSX.Element => {
  const { selectedView, setSelectedView } = useFavoritesView()
  const { favorites, prices, charts, isLoadingFavorites } = useWatchlist()

  const { data, sort, view } = useTrackSortAndView({
    tokens: favorites,
    prices,
    selectedView,
    setSelectedView
  })
  const listType = view.selected

  // Membership signature for the favorites set. Starring/unstarring a token
  // mutates `favorites` in place (same view + sort), so the inner list key
  // (`market-tokens-${view}-${sort}`) does NOT change and, on Fabric, the grid
  // columns fail to relayout around the added/removed cell (uneven gaps /
  // overlap). Folding this signature into the remount key forces a clean layout
  // pass when membership changes. It is order-independent (sorted ids) so the
  // price-driven re-sorting of the displayed rows never changes it — only an
  // actual add/remove does — which avoids remounting (and resetting scroll) on
  // every streamed price tick.
  const favoritesKey = useMemo(
    () =>
      favorites
        .map(token => token.id)
        .sort()
        .join(','),
    [favorites]
  )

  const emptyComponent = useMemo(() => {
    if (isLoadingFavorites) {
      return <LoadingState />
    }
    return (
      <ErrorState
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No favorite tokens"
        description="Star any token to add it to this screen"
      />
    )
  }, [isLoadingFavorites])

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper>
        {emptyComponent}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [emptyComponent])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      style={{
        flex: 1
      }}>
      <MarketTokensScreen
        key={`favorite-tokens-list-${listType}-${favoritesKey}`}
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

export default FavoriteScreen
