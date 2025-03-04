import React, { memo, useMemo } from 'react'
import { View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { Charts, MarketToken, Prices } from 'store/watchlist'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { LoadingState } from 'common/components/LoadingState'
import { useTokenSearch } from 'screens/watchlist/useTokenSearch'
import { Dimensions } from 'react-native'
import { MarketView } from '../consts'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketListItem from './MarketListItem'

const MarketScreen = ({
  tokens,
  prices,
  charts,
  goToMarketDetail,
  errorState,
  isLoadingTopTokens,
  searchText,
  isFavorites = false,
  isRefetchingTopTokens
}: {
  tokens: MarketToken[]
  prices: Prices
  charts: Charts
  goToMarketDetail: () => void
  errorState?: React.JSX.Element
  isLoadingTopTokens: boolean
  searchText: string
  isFavorites?: boolean
  isRefetchingTopTokens: boolean
}): JSX.Element => {
  const { isSearchingTokens, searchResults } = useTokenSearch({
    isFetchingTokens: isLoadingTopTokens || isRefetchingTopTokens,
    items: tokens,
    searchText,
    isSearchingFavorites: isFavorites
  })

  const tokensToDisplay = useMemo(() => {
    return searchResults?.tokens ?? tokens
  }, [searchResults?.tokens, tokens])

  const pricesToDisplay = useMemo(() => {
    return searchResults?.prices ?? prices
  }, [searchResults?.prices, prices])

  const chartsToDisplay = useMemo(() => {
    return searchResults?.charts ?? charts
  }, [searchResults?.charts, charts])

  const { data, sort, view } = useTrackSortAndView(
    tokensToDisplay,
    pricesToDisplay
  )

  const isGridView = view.data[0]?.[view.selected.row] === MarketView.Grid

  const dropdowns = useMemo(() => {
    return (
      <View
        sx={{
          width: WIDTH,
          paddingHorizontal: 16
        }}>
        <DropdownSelections sort={sort} view={view} />
      </View>
    )
  }, [sort, view])

  const emptyComponent = useMemo(() => {
    if (isSearchingTokens || isLoadingTopTokens || isRefetchingTopTokens) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (data.length === 0) {
      return errorState
    }
  }, [
    isSearchingTokens,
    isLoadingTopTokens,
    isRefetchingTopTokens,
    data.length,
    errorState
  ])

  const renderItem = ({
    item,
    index
  }: {
    item: MarketToken
    index: number
  }): React.JSX.Element => {
    return (
      <MarketListItem
        token={item}
        charts={chartsToDisplay}
        index={index}
        isGridView={isGridView}
        onPress={goToMarketDetail}
        isLastItem={index === data.length - 1}
      />
    )
  }

  return (
    <CollapsibleTabs.FlashList
      contentContainerStyle={{ paddingBottom: 16 }}
      data={data}
      numColumns={isGridView ? 2 : 1}
      renderItem={renderItem}
      ListHeaderComponent={dropdowns}
      ListEmptyComponent={emptyComponent}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      estimatedItemSize={isGridView ? 200 : 100}
      keyExtractor={item => item.id}
    />
  )
}

const WIDTH = Dimensions.get('window').width

export default memo(MarketScreen)
