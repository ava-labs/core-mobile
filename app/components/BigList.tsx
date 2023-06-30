import RNBigList from 'react-native-big-list'
import React from 'react'
import {
  RefreshControlProps,
  ListRenderItemInfo,
  StyleProp,
  ViewStyle
} from 'react-native'
import {
  DragEndParams,
  DraggableRenderItem
} from 'components/draggableList/types'

interface BigListProps<TItem> {
  data: TItem[]
  renderItem: (item: ListRenderItemInfo<TItem>) => React.ReactElement
  draggableListItem?: DraggableRenderItem<TItem>
  ListEmptyComponent?: React.ComponentType<unknown> | React.ReactElement
  refreshing?: boolean
  onRefresh?: () => void
  keyExtractor: (item: TItem) => string
  contentContainerStyle?: StyleProp<ViewStyle>
  onEndReached?: () => void
  onEndReachedThreshold?: number
  refreshControl?: React.ReactElement<RefreshControlProps>
  estimatedItemSize?: number
  isDraggable?: boolean
  onDragEnd?: (params: DragEndParams<TItem>) => void
}

/**
 * Performant list for large data set
 */
const BigList = <T,>({
  data,
  renderItem,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  keyExtractor,
  contentContainerStyle,
  onEndReached,
  onEndReachedThreshold,
  refreshControl,
  estimatedItemSize = 0
}: BigListProps<T>) => {
  return (
    <RNBigList
      data={data}
      renderItem={renderItem}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      refreshControl={refreshControl}
      contentContainerStyle={contentContainerStyle}
      keyExtractor={keyExtractor}
      indicatorStyle="white"
      onEndReached={onEndReached}
      itemHeight={estimatedItemSize}
    />
  )
}

export default BigList
