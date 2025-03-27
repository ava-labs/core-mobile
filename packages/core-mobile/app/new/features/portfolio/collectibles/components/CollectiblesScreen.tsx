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
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { Platform, useWindowDimensions } from 'react-native'

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
  goToCollectibleManagement
}: {
  goToCollectibleDetail: (
    localId: string,
    initial: CollectibleFilterAndSortInitialState
  ) => void
  goToCollectibleManagement: () => void
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const dimensions = useWindowDimensions()
  const { collectibles, isLoading, isEnabled, setIsEnabled } =
    useCollectiblesContext()

  const {
    filter,
    view,
    sort,
    isEveryCollectibleHidden,
    filteredAndSorted,
    onResetFilter,
    onShowHidden
  } = useCollectiblesFilterAndSort(collectibles)

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
  const estimatedItemSize = 200
  // listType === CollectibleView.ListView
  //   ? LIST_ITEM_HEIGHT
  //   : listType === CollectibleView.CompactGrid
  //   ? 160
  //   : 220

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

  const renderItem: ListRenderItem<NftItem> = ({ item, index }) => {
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
  }

  const noCollectiblesFound =
    Array.isArray(filter.selected) &&
    (filter.selected[0]?.row !== 0 || filter.selected[1]?.row !== 0)

  const renderEmpty = useMemo((): JSX.Element => {
    if (isLoading || !isEnabled)
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />

    if (noCollectiblesFound)
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

    if (isEveryCollectibleHidden) {
      return (
        <ErrorState
          sx={{
            height: portfolioTabContentHeight
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
          paddingTop: HORIZONTAL_MARGIN + 10
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
  }, [
    colors.$textPrimary,
    isEnabled,
    isEveryCollectibleHidden,
    isLoading,
    noCollectiblesFound,
    onResetFilter,
    onShowHidden
  ])

  const renderHeader = useMemo((): JSX.Element | undefined => {
    if (
      filteredAndSorted.length === 0 &&
      (!isEnabled || noCollectiblesFound || !isLoading) &&
      isEveryCollectibleHidden
    )
      return
    return (
      <View
        style={[
          {
            alignSelf: 'center',
            width: dimensions.width - HORIZONTAL_MARGIN * 2,
            zIndex: 10,
            marginTop: 4,
            marginBottom: CollectibleView.ListView === listType ? 8 : 16
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
    dimensions.width,
    filter,
    isEveryCollectibleHidden,
    filteredAndSorted.length,
    handleManageList,
    isEnabled,
    isLoading,
    listType,
    noCollectiblesFound,
    sort,
    view
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
      keyExtractor={(item: NftItem) => `collectibles-list-${item.localId}`}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={renderHeader}
      numColumns={columns}
      style={{
        overflow: 'visible',
        backgroundColor: 'blue'
      }}
      overrideProps={{
        contentContainerStyle
      }}
      contentContainerStyle={contentContainerStyle}
      scrollEnabled={filteredAndSorted?.length > 0}
      estimatedItemSize={estimatedItemSize}
      removeClippedSubviews={Platform.OS === 'android'}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    />
  )
}
