import {
  AnimatedPressable,
  Icons,
  IndexPath,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { RefreshControl } from 'components/RefreshControl'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { memo, ReactNode, useCallback, useEffect, useMemo } from 'react'
import { Platform, useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'

import { DropdownSelections } from 'common/components/DropdownSelections'
import { LoadingState } from 'common/components/LoadingState'
import {
  ASSET_MANAGE_VIEWS,
  AssetManageView,
  CollectibleView
} from 'store/balance'
import { NFTItem } from 'store/nft'
import { useCollectiblesContext } from '../CollectiblesContext'
import {
  HORIZONTAL_ITEM_GAP,
  HORIZONTAL_MARGIN,
  LIST_ITEM_HEIGHT,
  VERTICAL_ITEM_GAP
} from '../consts'
import { useCollectiblesFilterAndSort } from '../hooks/useCollectiblesFilterAndSort'
import { CardContainer } from './CardContainer'
import { CollectibleItem } from './CollectibleItem'

export const CollectiblesScreen = ({
  goToCollectibleDetail,
  goToCollectibleManagement
}: {
  goToCollectibleDetail: (localId: string) => void
  goToCollectibleManagement: () => void
}): ReactNode => {
  const dimensions = useWindowDimensions()
  const {
    collectibles,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    isError,
    fetchNextPage,
    refetch,
    setNftsLoadEnabled
  } = useCollectiblesContext()

  useEffect(() => {
    setNftsLoadEnabled(true)
  }, [setNftsLoadEnabled])

  const { filter, view, sort, filteredAndSorted, onResetFilter } =
    useCollectiblesFilterAndSort(collectibles)
  const listType = view.data[0]?.[view.selected.row] as CollectibleView
  const columns =
    listType === CollectibleView.CompactGrid
      ? 3
      : listType === CollectibleView.LargeGrid
      ? 2
      : 1
  const estimatedItemSize =
    listType === CollectibleView.ListView
      ? LIST_ITEM_HEIGHT
      : listType === CollectibleView.CompactGrid
      ? 120
      : 190

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const onRefresh = useCallback((): void => {
    refetch()
  }, [refetch])

  const renderItem: ListRenderItem<NFTItem> = ({ item, index }) => {
    return <CollectibleItem collectible={item} index={index} type={listType} />
  }

  const renderEmpty = useMemo((): JSX.Element => {
    if (isLoading)
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />

    if (isError)
      return (
        <ErrorState
          sx={{
            height: portfolioTabContentHeight
          }}
          title="No Collectibles found"
          description="
            Try changing the filter settings or reset the filter to see all assets."
          button={{
            title: 'Refresh',
            onPress: onRefresh
          }}
        />
      )

    if (
      Array.isArray(filter.selected) &&
      (filter.selected[0]?.row !== 0 || filter.selected[1]?.row !== 0)
    )
      return (
        <ErrorState
          sx={{
            height: portfolioTabContentHeight
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

    return <EmptyCollectibles />
  }, [filter.selected, isError, isLoading, onRefresh, onResetFilter])

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

  const renderLoadingMore = useMemo(() => {
    if (hasNextPage && isFetchingNextPage)
      return <LoadingState sx={{ height: LIST_ITEM_HEIGHT }} />
    return null
  }, [hasNextPage, isFetchingNextPage])

  const renderHeader = useMemo((): JSX.Element => {
    return (
      <View
        style={[
          {
            alignSelf: 'center',
            width: dimensions.width - HORIZONTAL_MARGIN * 2,
            zIndex: 10
          }
        ]}>
        <DropdownSelections
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [dimensions.width, filter, handleManageList, sort, view])

  return (
    <View
      style={{
        height: '100%'
      }}>
      <CollapsibleTabs.MasonryList
        data={filteredAndSorted}
        extraData={{
          listType,
          sort,
          filter
        }}
        key={`collectibles-list-${listType}`}
        keyExtractor={(item: NFTItem) => `collectibles-list-${item.uid}`}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderLoadingMore}
        numColumns={columns}
        style={{
          overflow: 'visible'
        }}
        contentContainerStyle={{
          paddingHorizontal: filteredAndSorted?.length
            ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2
            : 0,
          paddingBottom: HORIZONTAL_MARGIN
        }}
        scrollEnabled={filteredAndSorted?.length > 0}
        estimatedItemSize={estimatedItemSize}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
        refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={isRefetching} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const EmptyCollectibles = memo((): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flex: 1,
        flexDirection: 'row',
        gap: HORIZONTAL_MARGIN,
        padding: HORIZONTAL_MARGIN,
        paddingTop: 0
      }}>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <AnimatedPressable entering={getListItemEnteringAnimation(0)}>
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
})
