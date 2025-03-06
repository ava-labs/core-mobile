import React, { useMemo, useCallback } from 'react'
import { Separator, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { Charts, MarketToken } from 'store/watchlist'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { Space } from 'components/Space'
import { DropdownSelection } from 'common/types'
import { MarketView } from '../hooks/useTrackSortAndView'
import MarketListItem from './MarketListItem'

const MarketTokensScreen = ({
  data,
  charts,
  sort,
  view,
  goToMarketDetail,
  emptyComponent
}: {
  data: MarketToken[]
  charts: Charts
  sort: DropdownSelection
  view: DropdownSelection
  goToMarketDetail: (tokenId: string) => void
  emptyComponent: React.JSX.Element
}): JSX.Element => {
  const isGridView = view.data[0]?.[view.selected.row] === MarketView.Grid

  const dropdowns = useMemo(() => {
    return (
      <View sx={{ paddingHorizontal: 16 }}>
        <DropdownSelections sort={sort} view={view} />
      </View>
    )
  }, [sort, view])

  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: MarketToken
      index: number
    }): React.JSX.Element => {
      return (
        <MarketListItem
          token={item}
          charts={charts}
          index={index}
          isGridView={isGridView}
          onPress={() => goToMarketDetail(item.id)}
        />
      )
    },
    [charts, goToMarketDetail, isGridView]
  )

  const renderSeparator = (): JSX.Element => {
    return isGridView ? <Space y={12} /> : <Separator sx={{ marginLeft: 62 }} />
  }

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={{ paddingBottom: 16 }}
      data={data}
      numColumns={isGridView ? 2 : 1}
      renderItem={renderItem}
      ListHeaderComponent={data.length > 0 ? dropdowns : undefined}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => item.id}
      windowSize={5}
      removeClippedSubviews={true}
      getItemLayout={(_, index) => ({
        length: isGridView ? 200 : 120,
        offset: (isGridView ? 200 : 120) * index,
        index
      })}
      columnWrapperStyle={
        isGridView && {
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }
      }
    />
  )
}

export default MarketTokensScreen
