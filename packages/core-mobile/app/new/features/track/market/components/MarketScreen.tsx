import React, { memo, useMemo, useState } from 'react'
import { SearchBar, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { MarketToken } from 'store/watchlist'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { LoadingState } from 'common/components/LoadingState'
import { useTokenSearch } from 'screens/watchlist/useTokenSearch'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { RenderTarget, RenderTargetOptions } from '@shopify/flash-list'
import { Dimensions } from 'react-native'
import { MarketView } from '../consts'
import { useTrackSortAndView } from '../hooks/useTrackSortAndView'
import MarketListItem from './MarketListItem'

enum ItemType {
  StickyHeader = 'StickyHeader',
  Dropdowns = 'Dropdowns',
  Empty = 'Empty'
}

const MarketScreen = ({
  tokens,
  goToMarketDetail,
  errorState,
  isLoadingTopTokens,
  isRefetchingTopTokens
}: {
  tokens: MarketToken[]
  goToMarketDetail: () => void
  errorState?: React.JSX.Element
  isLoadingTopTokens: boolean
  isRefetchingTopTokens: boolean
}): JSX.Element => {
  const [searchText, setSearchText] = useState('')
  const { prices, charts } = useWatchlist()
  const { isSearchingTokens, searchResults } = useTokenSearch({
    isFetchingTokens: isLoadingTopTokens || isRefetchingTopTokens,
    items: tokens,
    searchText
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

  const dataWithHeaders = [
    ItemType.StickyHeader,
    ItemType.Empty,
    ItemType.Dropdowns,
    ItemType.Empty,
    ...data
  ]

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
    index,
    target
  }: {
    item: MarketToken | ItemType
    index: number
    target: RenderTarget
  }): React.JSX.Element => {
    if (item === ItemType.Empty) {
      return <></>
    }
    if (item === ItemType.StickyHeader) {
      return (
        <View
          sx={{
            width: WIDTH,
            backgroundColor: '$surfacePrimary',
            paddingHorizontal: 16,
            ...(target === RenderTargetOptions.StickyHeader && {
              paddingBottom: 8,
              borderBottomColor: '$surfaceSecondary',
              borderBottomWidth: 1
            })
          }}>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search"
          />
        </View>
      )
    }
    if (item === ItemType.Dropdowns) {
      return dropdowns
    }
    return (
      <MarketListItem
        token={item}
        charts={chartsToDisplay}
        index={index}
        isGridView={isGridView}
        onPress={goToMarketDetail}
        isLastItem={index === dataWithHeaders.length - 1}
      />
    )
  }

  return (
    <CollapsibleTabs.FlashList
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 16 }}
      data={dataWithHeaders}
      numColumns={isGridView ? 2 : 1}
      renderItem={renderItem}
      ListEmptyComponent={emptyComponent}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      getItemType={item => (typeof item === 'string' ? item : 'row')}
      estimatedItemSize={isGridView ? 200 : 100}
      keyExtractor={(item, index) =>
        typeof item === 'string' ? index.toString() : item.id
      }
    />
  )
}

const WIDTH = Dimensions.get('window').width

export default memo(MarketScreen)
