import React, { useMemo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { Separator, View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { Charts, MarketToken, MarketType } from 'store/watchlist'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { Space } from 'common/components/Space'
import { DropdownSelection } from 'common/types'
import { MarketView } from '../hooks/useTrackSortAndView'
import { MarketListItem } from './MarketListItem'

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
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  emptyComponent: React.JSX.Element
}): JSX.Element => {
  const isGridView = view.data[0]?.[view.selected.row] === MarketView.Grid
  const numColumns = isGridView ? 2 : 1

  const dataLength = data.length

  const dropdowns = useMemo(() => {
    if (dataLength === 0) return

    return (
      <View sx={styles.dropdownContainer}>
        <DropdownSelections sort={sort} view={view} sx={styles.dropdown} />
      </View>
    )
  }, [dataLength, sort, view])

  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: MarketToken
      index: number
    }): React.JSX.Element => {
      const isLeftColumn = index % numColumns === 0

      const content = (
        <MarketListItem
          token={item}
          charts={charts}
          index={index}
          isGridView={isGridView}
          onPress={() => goToMarketDetail(item.id, item.marketType)}
        />
      )

      if (isGridView) {
        return (
          <View
            sx={{
              marginLeft: isLeftColumn ? 8 : 0,
              marginRight: isLeftColumn ? 0 : 8,
              justifyContent: 'center',
              flex: 1,
              alignItems: 'center'
            }}>
            {content}
          </View>
        )
      }

      return content
    },
    [charts, goToMarketDetail, isGridView, numColumns]
  )

  const renderSeparator = useCallback((): JSX.Element => {
    return isGridView ? <Space y={12} /> : <Separator sx={{ marginLeft: 68 }} />
  }, [isGridView])

  return (
    <CollapsibleTabs.FlashList
      contentContainerStyle={styles.container}
      data={data}
      numColumns={numColumns}
      renderItem={renderItem}
      ListHeaderComponent={dropdowns}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => item.id}
      removeClippedSubviews={true}
      estimatedItemSize={isGridView ? 200 : 120}
    />
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  dropdownContainer: { paddingHorizontal: 16 },
  dropdown: { marginTop: 8, marginBottom: 12 }
})

export default MarketTokensScreen
