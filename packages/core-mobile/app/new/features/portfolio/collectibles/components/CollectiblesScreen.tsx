import { IndexPath, View } from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { Platform, useWindowDimensions } from 'react-native'

import { DropdownSelections } from 'common/components/DropdownSelections'
import { LoadingState } from 'common/components/LoadingState'
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
  LIST_ITEM_HEIGHT
} from '../consts'
import { useCollectiblesFilterAndSort } from '../hooks/useCollectiblesFilterAndSort'
import { CollectibleItem } from './CollectibleItem'
import { CollectiblesNone } from './CollectiblesNone'

export const CollectiblesScreen = ({
  // goToCollectibleDetail,
  goToCollectibleManagement
}: {
  goToCollectibleDetail: (localId: string) => void
  goToCollectibleManagement: () => void
}): ReactNode => {
  const dimensions = useWindowDimensions()
  const { collectibles, isLoading, isEnabled, setIsEnabled } =
    useCollectiblesContext()

  const { filter, view, sort, filteredAndSorted, onResetFilter } =
    useCollectiblesFilterAndSort(collectibles)

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
  const estimatedItemSize =
    listType === CollectibleView.ListView
      ? LIST_ITEM_HEIGHT
      : listType === CollectibleView.CompactGrid
      ? 120
      : 190

  const renderItem: ListRenderItem<NftItem> = ({ item, index }) => {
    return <CollectibleItem collectible={item} index={index} type={listType} />
  }

  const renderEmpty = useMemo((): JSX.Element => {
    if (isLoading || !isEnabled)
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />

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

    return <CollectiblesNone />
  }, [filter.selected, isEnabled, isLoading, onResetFilter])

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
        keyExtractor={(item: NftItem) => `collectibles-list-${item.localId}`}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
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
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
