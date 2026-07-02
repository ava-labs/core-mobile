import { Separator, View } from '@avalabs/k2-alpine'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { GRID_GAP } from 'common/consts'
import { ViewOption, DropdownSelection } from 'common/types'
import React, { useCallback } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { Charts, MarketToken, MarketType } from 'store/watchlist'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { MarketListItem } from './MarketListItem'

const MarketTokensScreen = ({
  data,
  charts,
  sort,
  view,
  goToMarketDetail,
  renderEmpty,
  containerStyle
}: {
  data: MarketToken[]
  charts: Charts
  sort: DropdownSelection
  view: DropdownSelection
  goToMarketDetail: (tokenId: string, marketType: MarketType) => void
  renderEmpty: () => React.JSX.Element
  containerStyle: ViewStyle
}): JSX.Element => {
  const isGridView = view.selected === ViewOption.Grid
  const numColumns = isGridView ? 2 : 1

  const dataLength = data.length

  const renderHeader = useCallback(() => {
    if (dataLength === 0) return null

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
              // Row gap is applied per-cell (not via ItemSeparatorComponent): a
              // FlashList v2 multi-column (flexWrap) grid doesn't row-align a
              // vertical separator, which produced uneven vertical gaps.
              marginBottom: GRID_GAP,
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

  // List view only. The grid view spaces rows via per-cell `marginBottom`
  // (see renderItem) because FlashList v2's flexWrap grid doesn't row-align an
  // ItemSeparatorComponent.
  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 68 }} />
  }, [])

  const keyExtractor = useCallback((item: MarketToken) => item.id, [])

  return (
    <CollapsibleTabList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      containerStyle={containerStyle}
      renderEmpty={renderEmpty}
      renderHeader={renderHeader}
      renderSeparator={isGridView ? undefined : renderSeparator}
      numColumns={numColumns}
      extraData={{ isGridView }}
      listKey={`market-tokens-${view.selected}-${sort.selected}`}
    />
  )
}

const styles = StyleSheet.create({
  dropdownContainer: { paddingHorizontal: 16 },
  dropdown: { marginBottom: 12 }
})

export default MarketTokensScreen
