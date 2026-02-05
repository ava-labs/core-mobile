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
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import { RefreshControl } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { NftItem } from 'services/nft/types'
import {
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const header = useHeaderMeasurements()
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
      if (value === CollectibleView.ManageList) {
        goToCollectibleManagement()
        return
      }
      onScrollResync()
      view.onSelected(value)
    },
    [onScrollResync, view, goToCollectibleManagement]
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

  const collapsibleHeaderHeight = header?.height ?? 0

  const renderNoCollectibles = useCallback(() => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingTop: 8
        }}>
        <AnimatedPressable onPress={goToDiscoverCollectibles}>
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
  }, [colors.$textPrimary, goToDiscoverCollectibles])

  const emptyComponent = useMemo((): JSX.Element | undefined => {
    if (isLoading || !isEnabled)
      return (
        <CollapsibleTabs.ContentWrapper>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )

    if (error || !isSuccess) {
      return (
        <CollapsibleTabs.ContentWrapper>
          <ErrorState
            description="Please hit refresh or try again later"
            button={{
              title: 'Refresh',
              onPress: refetch
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (filteredAndSorted.length === 0 && hasFilters) {
      return (
        <CollapsibleTabs.ContentWrapper>
          <ErrorState
            title="No collectibles found"
            description="Try changing the filter settings or reset the filter to see all assets."
            button={{
              title: 'Reset filter',
              onPress: onResetFilter
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (filteredAndSorted.length === 0 && isEveryCollectibleHidden) {
      return (
        <CollapsibleTabs.ContentWrapper animate={false}>
          <ErrorState
            title="All collectibles hidden"
            description="You have hidden all your collectibles"
            button={{
              title: 'Show hidden',
              onPress: onShowHidden
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    return renderNoCollectibles()
  }, [
    isLoading,
    isEnabled,
    error,
    isSuccess,
    filteredAndSorted.length,
    hasFilters,
    isEveryCollectibleHidden,
    renderNoCollectibles,
    refetch,
    onResetFilter,
    onShowHidden
  ])

  const renderHeader = useMemo((): JSX.Element | null => {
    if (collectibles.length === 0 && (!isEnabled || isLoading)) return null
    if (collectibles.length === 0) return null

    return (
      <View
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
      ...containerStyle,
      paddingTop: Platform.OS === 'android' ? header?.height : 0
    }
  }

  // When data is empty, use ScrollView to ensure scroll events propagate to the collapsible header
  // FlashList's ListEmptyComponent doesn't properly propagate scroll events in newer versions
  const shouldUseScrollView = filteredAndSorted.length === 0

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      {shouldUseScrollView ? (
        <CollapsibleTabs.ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={pullToRefresh}
              progressViewOffset={
                Platform.OS === 'ios' ? 0 : collapsibleHeaderHeight
              }
            />
          }
          contentContainerStyle={{
            flexGrow: 1,
            ...containerStyle,
            paddingTop: Platform.OS === 'android' ? header?.height : 0
          }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          {renderHeader}
          {emptyComponent}
        </CollapsibleTabs.ScrollView>
      ) : (
        <CollapsibleTabs.FlashList
          data={filteredAndSorted}
          extraData={{
            view,
            sort,
            filter
          }}
          masonry
          key={`collectibles-list-${listType}`}
          keyExtractor={(item: NftItem) =>
            `collectibles-list-${item.localId}-${item.address}`
          }
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          numColumns={columns}
          overrideProps={overrideProps}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={pullToRefresh}
              progressViewOffset={
                Platform.OS === 'ios' ? 0 : collapsibleHeaderHeight
              }
            />
          }
          contentContainerStyle={contentContainerStyle}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        />
      )}
    </Animated.View>
  )
}
