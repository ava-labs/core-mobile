import { FlashListProps, ListRenderItem } from '@shopify/flash-list'
import React, { useMemo } from 'react'
import { Platform, RefreshControlProps, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
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
   * Use masonry layout (for CollapsibleTabs.FlashList)
   */
  masonry?: boolean
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
  masonry,
  listKey,
  testID,
  overrideProps,
  contentContainerStyle: additionalContentStyle,
  nestedScrollEnabled,
  removeClippedSubviews
}: CollapsibleTabListProps<T>): JSX.Element {
  const header = useHeaderMeasurements()
  const collapsibleHeaderHeight = header?.height ?? 0

  // When data is empty, use ScrollView to ensure scroll events propagate to the collapsible header
  // FlashList's ListEmptyComponent doesn't properly propagate scroll events in newer versions
  const shouldUseScrollView = data.length === 0

  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined

    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        progressViewOffset={Platform.OS === 'ios' ? 0 : collapsibleHeaderHeight}
      />
    ) as React.ReactElement<RefreshControlProps>
  }, [isRefreshing, onRefresh, collapsibleHeaderHeight])

  const baseContentContainerStyle: ViewStyle = useMemo(
    () => ({
      flexGrow: 1,
      ...additionalContentStyle,
      ...containerStyle,
      paddingTop: Platform.OS === 'android' ? collapsibleHeaderHeight : 0
    }),
    [additionalContentStyle, containerStyle, collapsibleHeaderHeight]
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

  return (
    <CollapsibleTabs.FlashList
      key={listKey}
      testID={testID}
      data={data}
      extraData={extraData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={numColumns}
      masonry={masonry}
      overrideProps={finalOverrideProps}
      contentContainerStyle={baseContentContainerStyle}
      refreshControl={refreshControl}
      ListHeaderComponent={renderHeader}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={nestedScrollEnabled}
      removeClippedSubviews={removeClippedSubviews}
    />
  )
}
