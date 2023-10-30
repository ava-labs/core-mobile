import { FlashList as ShopifyFlashList } from '@shopify/flash-list'
import React from 'react'
import {
  ContentStyle,
  ListRenderItem as FlashListRenderItem
} from '@shopify/flash-list/dist/FlashListProps'
import { RefreshControlProps } from 'react-native'

interface AvaListProps<TItem> {
  data: TItem[]
  renderItem: FlashListRenderItem<TItem>
  ItemSeparatorComponent?: React.ComponentType
  ListEmptyComponent?: React.ComponentType | React.ReactElement
  refreshing?: boolean
  onRefresh?: () => void
  keyExtractor: (item: TItem) => string
  extraData?: unknown
  contentContainerStyle?: ContentStyle
  onEndReached?: () => void
  onEndReachedThreshold?: number
  refreshControl?: React.ReactElement<RefreshControlProps> | undefined
  getItemType?: (item: TItem, index: number, extraData?: unknown) => string
  estimatedItemSize?: number
}

/**
 * Performant list for large data set. This offer better performance than BigList.
 *
 * Warning: Do not use this component on Android as it causes intermittent crash
 */
const FlashList = <T,>({
  data,
  renderItem,
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
  estimatedItemSize
}: AvaListProps<T>) => {
  return (
    <ShopifyFlashList
      data={data}
      renderItem={renderItem}
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

export default FlashList
