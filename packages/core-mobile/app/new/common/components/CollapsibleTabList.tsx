import { ActivityIndicator, useTheme } from '@avalabs/k2-alpine'
import { FlashListProps, ListRenderItem } from '@shopify/flash-list'
import React, { useMemo } from 'react'
import { RefreshControlProps, View, ViewStyle } from 'react-native'
import {
  useCollapsibleStyle,
  useHeaderMeasurements
} from 'react-native-collapsible-tab-view'
import { RefreshControl } from 'react-native-gesture-handler'
import { CollapsibleTabs } from './CollapsibleTabs'

type CollapsibleTabListProps<T> = {
  /**
   * The data array for the list
   */
  data: T[]
  /**
   * Render function for each item
   */
  renderItem: ListRenderItem<T>
  /**
   * Key extractor function
   */
  keyExtractor: (item: T, index: number) => string
  /**
   * Container style from the parent collapsible tab
   */
  containerStyle?: ViewStyle
  /**
   * Component to render when the list is empty
   */
  renderEmpty?: () => React.ReactNode
  /**
   * Header component for the list
   */
  renderHeader?: () => React.ReactNode
  /**
   * Item separator component
   */
  renderSeparator?: () => React.ReactElement
  /**
   * Whether pull-to-refresh is active
   */
  isRefreshing?: boolean
  /**
   * Callback when pull-to-refresh is triggered
   */
  onRefresh?: () => void
  /**
   * Number of columns for grid layouts
   */
  numColumns?: number
  /**
   * Extra data to pass to the list for re-rendering
   */
  extraData?: FlashListProps<T>['extraData']
  /**
   * Unique key for the list (useful when switching between list types)
   */
  listKey?: string
  /**
   * Test ID for the list
   */
  testID?: string
  /**
   * Additional content container style
   */
  contentContainerStyle?: ViewStyle
  /**
   * Whether to enable nested scrolling
   */
  nestedScrollEnabled?: boolean
  /**
   * Whether to remove clipped subviews (Android optimization)
   */
  removeClippedSubviews?: boolean
  /**
   * Override props for the FlashList
   */
  overrideProps?: FlashListProps<T>['overrideProps']
  /**
   * FlashList visible-content anchoring behavior
   */
  maintainVisibleContentPosition?: FlashListProps<T>['maintainVisibleContentPosition']
  /**
   * Callback when the list reaches the end
   */
  onEndReached?: () => void
  /**
   * Whether a next-page fetch is currently in flight. When true, the footer
   * spinner is rendered; otherwise the footer is empty.
   */
  isFetchingNextPage?: boolean
  /**
   * Pre-computed column assignments for masonry layouts.
   * Each inner array is a column containing { item, index } tuples where
   * index is the item's position in the original data array.
   * When provided, renders a ScrollView with manually laid-out columns instead of relying on FlashList masonry internals.
   */
  columnItems?: { item: T; index: number }[][]
}

/**
 * A wrapper component that handles the common pattern of switching between
 * CollapsibleTabs.FlashList and CollapsibleTabs.ScrollView based on data availability.
 *
 * On Android, FlashList's ListEmptyComponent doesn't properly propagate scroll events
 * to the collapsible header, so we use ScrollView when data is empty.
 */
export function CollapsibleTabList<T>({
  data,
  renderItem,
  keyExtractor,
  containerStyle,
  renderEmpty,
  renderHeader,
  renderSeparator,
  isRefreshing = false,
  onRefresh,
  numColumns = 1,
  extraData,
  listKey,
  overrideProps,
  contentContainerStyle: additionalContentStyle,
  nestedScrollEnabled,
  removeClippedSubviews,
  maintainVisibleContentPosition,
  onEndReached,
  isFetchingNextPage = false,
  columnItems
}: CollapsibleTabListProps<T>): JSX.Element {
  const header = useHeaderMeasurements()
  const { theme } = useTheme()
  const collapsibleHeaderHeight = header?.height ?? 0
  // The library computes the correct layout-model `paddingTop` (reserve header
  // space) and `minHeight` (enough scroll range to fully collapse the header,
  // even when the actual content is short). FlashList only forwards the
  // library's `paddingTop` and drops its `minHeight`, and callers pass a
  // `minHeight` tuned for the old native-contentInset model, so apply both
  // explicitly here.
  const { contentContainerStyle: collapsibleStyle } = useCollapsibleStyle()

  // When data is empty, use ScrollView to ensure scroll events propagate to the collapsible header
  // FlashList's ListEmptyComponent doesn't properly propagate scroll events in newer versions
  const shouldUseScrollView = data.length === 0

  const ListFooterComponent = useMemo(() => {
    if (!isFetchingNextPage) return undefined
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.$textPrimary} />
      </View>
    )
  }, [isFetchingNextPage, theme.colors.$textPrimary])

  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined

    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        progressViewOffset={collapsibleHeaderHeight}
      />
    ) as React.ReactElement<RefreshControlProps>
  }, [isRefreshing, onRefresh, collapsibleHeaderHeight])

  const baseContentContainerStyle: ViewStyle = useMemo(
    () => ({
      flexGrow: 1,
      ...additionalContentStyle,
      ...containerStyle,
      // Reserve header space via layout on every platform (Fabric clamps the
      // old native-contentInset negative scroll). Override any caller-provided
      // `minHeight` with the library's value so the header can fully collapse
      // even when the content is shorter than the viewport.
      paddingTop: collapsibleStyle.paddingTop,
      minHeight: collapsibleStyle.minHeight
    }),
    [
      additionalContentStyle,
      containerStyle,
      collapsibleStyle.paddingTop,
      collapsibleStyle.minHeight
    ]
  )

  const finalOverrideProps = useMemo(
    () => ({
      ...overrideProps,
      contentContainerStyle: baseContentContainerStyle
    }),
    [baseContentContainerStyle, overrideProps]
  )

  if (shouldUseScrollView) {
    return (
      <CollapsibleTabs.ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={baseContentContainerStyle}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={nestedScrollEnabled}>
        {renderHeader?.()}
        {renderEmpty?.()}
      </CollapsibleTabs.ScrollView>
    )
  }

  // When pre-computed column assignments are provided, render columns manually in a
  // ScrollView instead of relying on FlashList masonry to determine item placement.
  if (columnItems) {
    return (
      <CollapsibleTabs.ScrollView
        key={listKey}
        refreshControl={refreshControl}
        contentContainerStyle={baseContentContainerStyle}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={nestedScrollEnabled}>
        {renderHeader?.()}
        <View style={{ flexDirection: 'row' }}>
          {columnItems.map((col, colIndex) => (
            <View key={colIndex} style={{ flex: 1 }}>
              {col.map(entry => (
                <React.Fragment key={keyExtractor(entry.item, entry.index)}>
                  {renderItem({
                    item: entry.item,
                    index: entry.index,
                    target: 'Cell'
                  })}
                </React.Fragment>
              ))}
            </View>
          ))}
        </View>
      </CollapsibleTabs.ScrollView>
    )
  }

  return (
    <CollapsibleTabs.FlashList
      key={listKey}
      data={data}
      extraData={extraData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={numColumns}
      overrideProps={finalOverrideProps}
      contentContainerStyle={baseContentContainerStyle}
      refreshControl={refreshControl}
      maintainVisibleContentPosition={maintainVisibleContentPosition}
      ListHeaderComponent={renderHeader}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={nestedScrollEnabled}
      removeClippedSubviews={removeClippedSubviews}
      ListFooterComponent={ListFooterComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  )
}
