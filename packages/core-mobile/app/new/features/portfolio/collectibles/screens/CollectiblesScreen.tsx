import {
  AnimatedPressable,
  Icons,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  ViewStyle
} from 'react-native'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated from 'react-native-reanimated'
import { NftItem } from 'services/nft/types'
import {
  AssetManageView,
  AssetNetworkFilter,
  CollectibleSort,
  CollectibleTypeFilter,
  CollectibleView
} from 'store/balance'
import { useCollectiblesContext } from '../CollectiblesContext'
import { CardContainer } from '../components/CardContainer'
import { CollectibleItem } from '../components/CollectibleItem'
import { HORIZONTAL_ITEM_GAP, HORIZONTAL_MARGIN } from '../consts'
import {
  CollectibleFilterAndSortInitialState,
  useCollectiblesFilterAndSort
} from '../hooks/useCollectiblesFilterAndSort'

export const CollectiblesScreen = ({
  containerStyle,
  goToCollectibleDetail,
  goToCollectibleManagement,
  goToDiscoverCollectibles,
  onScrollResync
}: {
  goToCollectibleDetail: (
    localId: string,
    initial: CollectibleFilterAndSortInitialState
  ) => void
  goToCollectibleManagement: () => void
  goToDiscoverCollectibles: () => void
  onScrollResync: () => void
  containerStyle: ViewStyle
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const {
    isLoading,
    isEnabled,
    setIsEnabled,
    refetch,
    error,
    isSuccess,
    isRefreshing,
    pullToRefresh,
    collectibles
  } = useCollectiblesContext()

  const {
    filter,
    view,
    sort,
    isEveryCollectibleHidden,
    filteredAndSorted,
    onResetFilter,
    onShowHidden
  } = useCollectiblesFilterAndSort()

  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | null>(null)

  useEffect(() => {
    setIsEnabled(true)
  }, [isEnabled, setIsEnabled])

  useEffect(() => {
    // We want the resync to happen after the list is loaded
    if (!isLoading && isEnabled) {
      onScrollResync()
    }
  }, [isEnabled, isLoading, onScrollResync])

  const listType = view.selected as CollectibleView
  const columns =
    listType === CollectibleView.CompactGrid
      ? 3
      : listType === CollectibleView.LargeGrid
      ? 2
      : 1

  const handleManageList = useCallback(
    (value: string): void => {
      if (value === AssetManageView.ManageList) {
        goToCollectibleManagement()
        return
      }
      onScrollResync()
      view.onSelected(value)
    },
    [goToCollectibleManagement, view, onScrollResync]
  )

  const renderItem: ListRenderItem<NftItem> = useCallback(
    ({ item, index }) => {
      return (
        <CollectibleItem
          onPress={() => {
            goToCollectibleDetail(item.localId, {
              filters: {
                network: filter?.selected[0] as AssetNetworkFilter,
                contentType: filter?.selected[1] as CollectibleTypeFilter
              },
              sort: sort.selected as CollectibleSort
            })
          }}
          collectible={item}
          index={index}
          type={listType}
        />
      )
    },
    [filter, goToCollectibleDetail, listType, sort]
  )

  const hasFilters =
    Array.isArray(filter.selected) &&
    (filter.selected[0] !== AssetNetworkFilter.AllNetworks ||
      filter.selected[1] !== CollectibleTypeFilter.AllContents)

  const emptyComponent = useMemo((): JSX.Element | undefined => {
    if (isLoading || !isEnabled) return <LoadingState />

    if (error || !isSuccess) {
      return (
        <ErrorState
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refetch
          }}
        />
      )
    }

    if (filteredAndSorted.length === 0 && hasFilters) {
      return (
        <ErrorState
          title="No Collectibles found"
          description="
              Try changing the filter settings or reset the filter to see all assets."
          button={{
            title: 'Reset filter',
            onPress: onResetFilter
          }}
        />
      )
    }

    if (filteredAndSorted.length === 0 && isEveryCollectibleHidden) {
      return (
        <ErrorState
          title="All collectibles hidden"
          description="You have hidden all your collectibles"
          button={{
            title: 'Show hidden',
            onPress: onShowHidden
          }}
        />
      )
    }
  }, [
    isLoading,
    isEnabled,
    error,
    isSuccess,
    filteredAndSorted.length,
    hasFilters,
    isEveryCollectibleHidden,
    refetch,
    onResetFilter,
    onShowHidden
  ])

  const renderEmpty = useMemo(() => {
    return (
      <CollapsibleTabs.ContentWrapper
        height={
          Number(containerStyle.minHeight) - (headerLayout?.height ?? 0) - 80
        }>
        {emptyComponent}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [containerStyle.minHeight, headerLayout?.height, emptyComponent])

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderLayout(e.nativeEvent.layout)
  }, [])

  const renderHeader = useMemo((): JSX.Element | null => {
    if (collectibles.length === 0 && (!isEnabled || isLoading)) return null
    if (collectibles.length === 0) return null

    return (
      <View
        onLayout={onHeaderLayout}
        style={[
          {
            alignSelf: 'center',
            width: SCREEN_WIDTH - HORIZONTAL_MARGIN * 2
          }
        ]}>
        <DropdownSelections
          sx={{
            paddingBottom: CollectibleView.ListView === listType ? 8 : 16
          }}
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [
    collectibles.length,
    isEnabled,
    isLoading,
    onHeaderLayout,
    listType,
    filter,
    sort,
    view,
    handleManageList
  ])

  const contentContainerStyle = {
    paddingHorizontal:
      listType === CollectibleView.ListView
        ? 0
        : filteredAndSorted?.length
        ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2
        : 0
  }

  // Fix for making the list scrollable if there are just a few collectibles
  // overrideProps and contentContainerStyle need to be both used with the same stylings for item width calculations
  const overrideProps = {
    contentContainerStyle: {
      flexGrow: 1,
      ...contentContainerStyle,
      ...containerStyle
    }
  }

  const header = useHeaderMeasurements()

  if (collectibles.length === 0 && !isLoading && isEnabled) {
    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: HORIZONTAL_MARGIN,
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingTop: header.height + HORIZONTAL_MARGIN / 2
        }}>
        <AnimatedPressable
          onPress={goToDiscoverCollectibles}
          entering={getListItemEnteringAnimation(0)}>
          <CardContainer
            style={{
              height: 220,
              width: (SCREEN_WIDTH - HORIZONTAL_MARGIN * 3) / 2
            }}>
            <Icons.Content.Add
              color={colors.$textPrimary}
              width={40}
              height={40}
            />
          </CardContainer>
        </AnimatedPressable>
      </View>
    )
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <CollapsibleTabs.MasonryList
        data={filteredAndSorted}
        extraData={{
          view,
          sort,
          filter
        }}
        key={`collectibles-list-${listType}`}
        keyExtractor={(item: NftItem) =>
          `collectibles-list-${item.localId}-${item.address}`
        }
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        numColumns={columns}
        overrideProps={overrideProps}
        onRefresh={pullToRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={contentContainerStyle}
        estimatedItemSize={220}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      />
    </Animated.View>
  )
}
