import React, { memo, useMemo } from 'react'
import { Separator, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { MarketToken } from 'store/watchlist'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useTokenSearch } from 'screens/watchlist/useTokenSearch'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Space } from 'components/Space'
import { MarketView } from '../consts'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketListItem from './MarketListItem'

const MarketScreen = ({
  tokens,
  goToMarketDetail,
  searchText
}: {
  tokens: MarketToken[]
  goToMarketDetail: () => void
  searchText: string
}): JSX.Element => {
  const { prices, charts } = useWatchlist()
  const currency = useFocusedSelector(selectSelectedCurrency).toLowerCase()
  const isFetchingTokens = tokens.length === 0
  const { isSearchingTokens, searchResults } = useTokenSearch({
    isFetchingTokens,
    items: tokens,
    searchText,
    currency
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
  const showLoader = isSearchingTokens || isFetchingTokens

  const header = useMemo(() => {
    return (
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <DropdownSelections sort={sort} view={view} />
      </View>
    )
  }, [sort, view])

  const emptyComponent = useMemo(() => {
    if (showLoader) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (data.length === 0) {
      return <ErrorState />
    }
  }, [showLoader, data])

  const renderSeparator = (): JSX.Element => {
    return isGridView ? <Space y={16} /> : <Separator sx={{ marginLeft: 62 }} />
  }

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
      />
    )
  }

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={{ overflow: 'visible', paddingBottom: 16 }}
      data={data}
      numColumns={isGridView ? 2 : 1}
      renderItem={item => renderItem({ item: item.item, index: item.index })}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => item.id}
      columnWrapperStyle={
        isGridView && {
          paddingHorizontal: 16,
          justifyContent: 'space-between',
          gap: 14
        }
      }
    />
  )
}

export default memo(MarketScreen)
