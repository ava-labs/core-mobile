import {
  AnimatedPressable,
  Icons,
  IndexPath,
  SCREEN_WIDTH,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'

import { DropdownSelections } from 'common/components/DropdownSelections'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import Animated from 'react-native-reanimated'
import { NftItem } from 'services/nft/types'
import {
  ASSET_MANAGE_VIEWS,
  AssetManageView,
  CollectibleView
} from 'store/balance'
import { useCollectiblesContext } from '../CollectiblesContext'
import {
  HORIZONTAL_ITEM_GAP,
  HORIZONTAL_MARGIN,
  VERTICAL_ITEM_GAP
} from '../consts'
import {
  CollectibleFilterAndSortInitialState,
  useCollectiblesFilterAndSort
} from '../hooks/useCollectiblesFilterAndSort'
import { CardContainer } from './CardContainer'
import { CollectibleItem } from './CollectibleItem'

export const CollectiblesScreen = ({
  goToCollectibleDetail,
  goToCollectibleManagement,
  goToDiscoverCollectibles
}: {
  goToCollectibleDetail: (
    localId: string,
    initial: CollectibleFilterAndSortInitialState
  ) => void
  goToCollectibleManagement: () => void
  goToDiscoverCollectibles: () => void
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

  useEffect(() => {
    setIsEnabled(true)
  }, [isEnabled, setIsEnabled])

  const listType = view.data[0]?.[view.selected.row] as CollectibleView
  const columns =
    listType === CollectibleView.CompactGrid
      ? 3
      : listType === CollectibleView.LargeGrid
      ? 2
      : 1

  const handleManageList = useCallback(
    (indexPath: IndexPath): void => {
      const manageList =
        ASSET_MANAGE_VIEWS?.[indexPath.section]?.[indexPath.row]
      if (manageList === AssetManageView.ManageList) {
        goToCollectibleManagement()
        return
      }
      view.onSelected(indexPath)
    },
    [goToCollectibleManagement, view]
  )

  const renderItem: ListRenderItem<NftItem> = useCallback(
    ({ item, index }) => {
      return (
        <CollectibleItem
          onPress={() => {
            goToCollectibleDetail(item.localId, {
              filters: {
                network: filter?.selected[0] as IndexPath,
                contentType: filter?.selected[1] as IndexPath
              },
              sort: sort.selected
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
    (filter.selected[0]?.row !== 0 || filter.selected[1]?.row !== 0)

  const renderEmpty = useMemo((): JSX.Element => {
    if (isLoading || !isEnabled)
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />

    if (error || !isSuccess) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight - 100 }}
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
          sx={{
            height: portfolioTabContentHeight - 100
          }}
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
          sx={{
            height: portfolioTabContentHeight - 100
          }}
          title="All collectibles hidden"
          description="You have hidden all your collectibles"
          button={{
            title: 'Show hidden',
            onPress: onShowHidden
          }}
        />
      )
    }

    return (
      <View
        sx={{
          flex: 1,
          flexDirection: 'row',
          gap: HORIZONTAL_MARGIN,
          marginHorizontal: HORIZONTAL_MARGIN,
          paddingTop: HORIZONTAL_MARGIN / 2
        }}>
        <View
          style={{
            flex: 1,
            gap: VERTICAL_ITEM_GAP
          }}>
          <AnimatedPressable
            onPress={goToDiscoverCollectibles}
            entering={getListItemEnteringAnimation(0)}>
            <CardContainer
              style={{
                height: 220
              }}>
              <Icons.Content.Add
                color={colors.$textPrimary}
                width={40}
                height={40}
              />
            </CardContainer>
          </AnimatedPressable>

          <Animated.View entering={getListItemEnteringAnimation(1)}>
            <CardContainer
              style={{
                height: 180
              }}
            />
          </Animated.View>
        </View>
        <View
          style={{
            flex: 1,
            gap: VERTICAL_ITEM_GAP
          }}>
          <Animated.View entering={getListItemEnteringAnimation(2)}>
            <CardContainer
              style={{
                height: 190
              }}
            />
          </Animated.View>
          <Animated.View entering={getListItemEnteringAnimation(3)}>
            <CardContainer
              style={{
                height: 190
              }}
            />
          </Animated.View>
        </View>
      </View>
    )
  }, [
    isLoading,
    isEnabled,
    error,
    isSuccess,
    filteredAndSorted.length,
    hasFilters,
    isEveryCollectibleHidden,
    goToDiscoverCollectibles,
    colors.$textPrimary,
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
            width: SCREEN_WIDTH - HORIZONTAL_MARGIN * 2,
            zIndex: 10,
            marginTop: 4,
            marginBottom: CollectibleView.ListView === listType ? 8 : 10
          }
        ]}>
        <DropdownSelections
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

  // Fix for making the list scrollable if there are just a few collectibles
  // overrideProps and contentContainerStyle need to be both used with the same stylings for item width calculations
  const contentContainerStyle = {
    flexGrow: 1,
    paddingHorizontal:
      listType === CollectibleView.ListView
        ? 0
        : filteredAndSorted?.length
        ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2
        : 0,
    paddingBottom: HORIZONTAL_MARGIN
  }

  return (
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
      style={{
        overflow: 'visible'
      }}
      overrideProps={{
        contentContainerStyle
      }}
      onRefresh={pullToRefresh}
      refreshing={isRefreshing}
      contentContainerStyle={contentContainerStyle}
      scrollEnabled={filteredAndSorted?.length > 0}
      estimatedItemSize={220}
      removeClippedSubviews={Platform.OS === 'android'}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    />
  )
}
