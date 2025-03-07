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
import { AssetsHeader } from 'features/portfolio/assets/components/AssetsHeader'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { Platform, useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'

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
  VERTICAL_ITEM_GAP
} from '../consts'
import { useFilterAndSort } from '../hooks/useFilterAndSort'
import { CardContainer } from './CardContainer'
import { CollectibleGridItem } from './CollectibleItem'

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}

export const CollectiblesScreen = ({
  goToCollectibleDetail,
  goToCollectibleManagement
}: {
  goToCollectibleDetail: (localId: string) => void
  goToCollectibleManagement: () => void
}): JSX.Element => {
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
    useFilterAndSort(collectibles)

  const listType = view.data[0]?.[view.selected.row] as CollectibleView
  const columns =
    listType === CollectibleView.CompactGrid
      ? 3
      : listType === CollectibleView.LargeGrid
      ? 2
      : 1

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const onRefresh = (): void => {
    refetch()
  }

  const renderItem: ListRenderItem<NFTItem> = ({ item, index }) => {
    return (
      <CollectibleGridItem collectible={item} index={index} type={listType} />
    )
  }

  const renderEmpty = (): JSX.Element => {
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
      filter.selected instanceof Array &&
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
  }

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
    if (isLoading) return <LoadingState />
    return null
  }, [isLoading])

  return (
    <View style={{ flex: 1, position: 'relative' }}>
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
        numColumns={columns}
        estimatedItemSize={180}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filteredAndSorted?.length > 0}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          <View
            style={[
              {
                alignSelf: 'center',
                marginBottom: 8,
                width: dimensions.width - HORIZONTAL_MARGIN * 2,
                zIndex: 10
              }
            ]}>
            <AssetsHeader
              filter={filter}
              sort={sort}
              view={{ ...view, onSelected: handleManageList }}
            />
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
        ListFooterComponent={renderLoadingMore}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={isRefetching} />
        }
        style={{
          overflow: 'visible'
        }}
        contentContainerStyle={{
          padding: filteredAndSorted?.length
            ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2
            : 0,
          paddingTop: HORIZONTAL_MARGIN + 4,
          paddingBottom: HORIZONTAL_MARGIN
        }}
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
        paddingTop: 8
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
