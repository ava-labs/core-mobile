import React from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { ListFilterHeader } from '../ListFilterHeader'
import { TokenListItem } from './TokenListItem'
import { useFilterAndSort } from './useFilterAndSort'
import { ActionButton as TSquareButton } from './types'
import { ACTION_BUTTONS, AssetManageView } from './consts'
import { ActionButton } from './ActionButton'

interface Props {
  tokens: LocalTokenWithBalance[]
}

export const TokensList = ({ tokens }: Props): React.JSX.Element => {
  const { data, filter, sort, view } = useFilterAndSort(tokens)

  const goToTokenDetail = (): void => {
    // TODO: go to token detail
  }

  const isGridView =
    view.data[0]?.[view.selected.row] === AssetManageView.Hightlights

  const renderItem = (
    token: LocalTokenWithBalance,
    index: number,
    gridView: boolean
  ): React.JSX.Element => {
    return (
      <TokenListItem
        token={token}
        index={index}
        onPress={goToTokenDetail}
        isGridView={gridView}
      />
    )
  }

  const renderActionItem = (
    item: TSquareButton,
    index: number
  ): React.JSX.Element => {
    return <ActionButton item={item} index={index} key={index} />
  }

  const renderSeparator = (): React.JSX.Element => {
    return <Space y={isGridView ? 16 : 10} />
  }

  return (
    <View sx={{ marginTop: 30, flex: 1 }}>
      <Animated.FlatList
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
        horizontal
        scrollEventThrottle={16}
        data={ACTION_BUTTONS}
        renderItem={item => renderActionItem(item.item, item.index)}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        itemLayoutAnimation={LinearTransition.springify()}
      />
      <ListFilterHeader filter={filter} sort={sort} view={view} />
      <Animated.FlatList
        scrollEventThrottle={16}
        data={data}
        numColumns={isGridView ? 2 : 1}
        renderItem={item =>
          renderItem(item.item as LocalTokenWithBalance, item.index, isGridView)
        }
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        key={isGridView ? 'grid' : 'list'}
        keyExtractor={item => (item as LocalTokenWithBalance).localId}
        columnWrapperStyle={
          isGridView && {
            justifyContent: 'space-between',
            gap: 16
          }
        }
      />
    </View>
  )
}
