import { FlashList } from '@shopify/flash-list'
import React from 'react'
import {
  ContentStyle,
  ListRenderItem as FlashListRenderItem
} from '@shopify/flash-list/dist/FlashListProps'
import { RefreshControlProps } from 'react-native'
import DraggableFlatList from 'react-native-draggable-flatlist/src/components/DraggableFlatList'
import {
  DragEndParams,
  RenderItem
} from 'react-native-draggable-flatlist/src/types'

interface AvaFlashListProps<TItem> {
  data: ReadonlyArray<TItem> | null | undefined
  flashRenderItem: FlashListRenderItem<TItem> | null | undefined
  draggableListItem?: RenderItem<TItem> | null | undefined
  ItemSeparatorComponent?: React.ComponentType<unknown> | null | undefined
  ListEmptyComponent?:
    | React.ComponentType<unknown>
    | React.ReactElement
    | null
    | undefined
  refreshing?: boolean | null | undefined
  onRefresh?: (() => void) | null | undefined
  keyExtractor: (item: TItem, index: number) => string
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
  isShowingFavorites?: boolean
  onDragEnd?: (params: DragEndParams<TItem>) => void
}

/**
 * This component selects between Flash and Draggable list depending on isShowingFavorites flag
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
  getItemType,
  estimatedItemSize,
  isShowingFavorites,
  onDragEnd
}: AvaFlashListProps<T>) => {
  return isShowingFavorites && draggableListItem ? (
    <DraggableFlatList
      data={data ? [...data] : []}
      onDragEnd={onDragEnd}
      renderItem={draggableListItem}
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
  ) : (
    <FlashList
      data={data}
      renderItem={flashRenderItem}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      refreshControl={refreshControl}
      contentContainerStyle={contentContainerStyle}
      keyExtractor={keyExtractor}
      indicatorStyle="white"
      getItemType={getItemType}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      estimatedItemSize={estimatedItemSize}
      extraData={extraData}
    />
  )
}

export default AvaList
