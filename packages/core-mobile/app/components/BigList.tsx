import RNBigList from 'react-native-big-list'
import React from 'react'
import {
  RefreshControlProps,
  ListRenderItemInfo,
  StyleProp,
  ViewStyle
} from 'react-native'
import { RefreshControl } from './RefreshControl'

interface BigListProps<TItem> {
  data: TItem[]
  renderItem: (item: ListRenderItemInfo<TItem>) => React.ReactElement
  ListEmptyComponent?: React.ComponentType<unknown> | React.ReactElement
  refreshing?: boolean
  onRefresh?: () => void
  keyExtractor: (item: TItem) => string
  contentContainerStyle?: StyleProp<ViewStyle>
  onEndReached?: () => void
  onEndReachedThreshold?: number
  refreshControl?: React.ReactElement<RefreshControlProps>
  estimatedItemSize?: number
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
  estimatedItemSize = 0
}: BigListProps<T>) => {
  const hasRefreshProps =
    typeof onRefresh === 'function' && typeof refreshing === 'boolean'

  return (
    <RNBigList
      data={data}
      renderItem={renderItem}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={contentContainerStyle}
      keyExtractor={keyExtractor}
      indicatorStyle="white"
      onEndReached={onEndReached}
      itemHeight={estimatedItemSize}
      refreshControl={
        hasRefreshProps ? (
          <RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
        ) : undefined
      }
    />
  )
}

export default BigList
