import BigList from 'react-native-big-list'
import React from 'react'
import {
  ContentStyle,
  ListRenderItem as FlashListRenderItem
} from '@shopify/flash-list/dist/FlashListProps'
import { RefreshControlProps } from 'react-native'
import DraggableList from 'components/draggableList/DraggableList'
import {
  DragEndParams,
  DraggableRenderItem
} from 'components/draggableList/types'

interface AvaListProps<TItem> {
  data: TItem[] | null | undefined
  flashRenderItem: FlashListRenderItem<TItem> | null | undefined
  draggableListItem?: DraggableRenderItem<TItem> | null | undefined
  ItemSeparatorComponent?: React.ComponentType<unknown> | null | undefined
  ListEmptyComponent?:
    | React.ComponentType<unknown>
    | React.ReactElement
    | null
    | undefined
  refreshing?: boolean | null | undefined
  onRefresh?: (() => void) | null | undefined
  keyExtractor: (item: TItem) => string
  extraData?: unknown
  contentContainerStyle?: ContentStyle
  onEndReached?: (() => void) | null | undefined
  onEndReachedThreshold?: number | null | undefined
  refreshControl?: React.ReactElement<RefreshControlProps> | undefined
  getItemType?: (
    item: TItem,
    index: number,
    extraData?: unknown
  ) => string | number | undefined
  estimatedItemSize?: number | undefined
  isDraggable?: boolean
  onDragEnd?: (params: DragEndParams<TItem>) => void
}

/**
 * This component selects between Flash and Draggable list depending on isDraggable flag
 */
const AvaList = <T,>({
  data,
  flashRenderItem,
  draggableListItem,
  ItemSeparatorComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  keyExtractor,
  extraData,
  contentContainerStyle,
  onEndReached,
  onEndReachedThreshold,
  refreshControl,
  // getItemType,
  estimatedItemSize,
  isDraggable,
  onDragEnd
}: AvaListProps<T>) => {
  function handleOnDragEnd(dragEndParams: DragEndParams<T>) {
    onDragEnd?.(dragEndParams)
  }

  return isDraggable && draggableListItem ? (
    <DraggableList
      data={data || []}
      keyExtractor={keyExtractor}
      renderItem={draggableListItem}
      onDragEnd={handleOnDragEnd}
      ListEmptyComponent={ListEmptyComponent}
    />
  ) : (
    // @ts-expect-error
    <BigList
      data={data}
      renderItem={flashRenderItem}
      onEndReachedThreshold={onEndReachedThreshold}
      getItemLayout={(_data, index) => ({
        length: estimatedItemSize,
        offset: 60 * index,
        index
      })}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      refreshControl={refreshControl}
      contentContainerStyle={contentContainerStyle}
      keyExtractor={keyExtractor}
      indicatorStyle="white"
      onEndReached={onEndReached}
      extraData={extraData}
    />
  )
}

// ;<FlashList
//   data={data}
//   renderItem={flashRenderItem}
//   ItemSeparatorComponent={ItemSeparatorComponent}
//   ListEmptyComponent={ListEmptyComponent}
//   refreshing={refreshing}
//   onRefresh={onRefresh}
//   refreshControl={refreshControl}
//   contentContainerStyle={contentContainerStyle}
//   keyExtractor={keyExtractor}
//   indicatorStyle="white"
//   getItemType={getItemType}
//   onEndReached={onEndReached}
//   onEndReachedThreshold={onEndReachedThreshold}
//   estimatedItemSize={estimatedItemSize}
//   extraData={extraData}
// />
export default AvaList
