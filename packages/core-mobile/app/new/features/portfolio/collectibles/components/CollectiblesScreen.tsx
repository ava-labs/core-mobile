import { ChainId } from '@avalabs/core-chains-sdk'
import {
  AnimatedPressable,
  Icons,
  IndexPath,
  Text,
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
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Platform, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'

import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions } from 'react-native'

import {
  ASSET_MANAGE_VIEWS,
  AssetManageView,
  COLLECTIBLE_NETWORK_FILTERS,
  COLLECTIBLE_SORTS,
  COLLECTIBLE_VIEWS,
  CollectibleNetworkFilter,
  CollectibleSort,
  CollectibleView
} from 'store/balance'
import { NFTItem } from 'store/nft'
import { useCollectiblesContext } from '../CollectiblesContext'
import {
  HORIZONTAL_ITEM_GAP,
  HORIZONTAL_MARGIN,
  VERTICAL_ITEM_GAP
} from '../consts'
import { CardContainer } from './CardContainer'
import { CollectibleGridItem } from './CollectibleItem'
import { LoadingState } from 'common/components/LoadingState'

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

  const [selectedFilter, setSelectedFilter] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 2
  })
  const [selectedView, setSelectedView] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const filterOption = useMemo(() => {
    return (
      COLLECTIBLE_NETWORK_FILTERS?.[selectedFilter.section]?.[
        selectedFilter.row
      ] ?? CollectibleNetworkFilter.AllNetworks
    )
  }, [selectedFilter])

  const sortOption = useMemo(() => {
    return (
      COLLECTIBLE_SORTS?.[selectedSort.section]?.[selectedSort.row] ??
      CollectibleSort.NameAToZ
    )
  }, [selectedSort])

  const filter = useMemo(
    () => ({
      title: 'Filter',
      data: COLLECTIBLE_NETWORK_FILTERS,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    }),
    [selectedFilter]
  )
  const sort = useMemo(
    () => ({
      title: 'Sort',
      data: COLLECTIBLE_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    }),
    [selectedSort]
  )
  const view = useMemo(
    () => ({
      title: 'View',
      data: COLLECTIBLE_VIEWS,
      selected: selectedView,
      onSelected: setSelectedView
    }),
    [selectedView]
  )

  const listType = view.data[0]?.[view.selected.row] as CollectibleView
  const columns =
    listType === CollectibleView.CompactGrid
      ? 3
      : listType === CollectibleView.LargeGrid
      ? 2
      : 1

  const getFiltered = useCallback(() => {
    if (collectibles.length === 0) {
      return []
    }
    switch (filterOption) {
      case CollectibleNetworkFilter.AvalancheCChain:
        return collectibles.filter(
          nft =>
            ('chainId' in nft &&
              nft.chainId &&
              isAvalancheCChainId(Number(nft.chainId))) ||
            nft.localId === 'AvalancheAVAX'
        )
      case CollectibleNetworkFilter.Ethereum:
        return collectibles.filter(
          token =>
            'chainId' in token &&
            (Number(token.chainId) === ChainId.ETHEREUM_HOMESTEAD ||
              Number(token.chainId) === ChainId.ETHEREUM_TEST_GOERLY ||
              Number(token.chainId) === ChainId.ETHEREUM_TEST_SEPOLIA)
        )
      case CollectibleNetworkFilter.BitcoinNetwork:
        // token.tokenId?
        return collectibles.filter(token => token.symbol === 'BTC')
      default:
        return collectibles
    }
  }, [filterOption, collectibles])

  const getSorted = useCallback(
    (filtered: NFTItem[]) => {
      if (sortOption === CollectibleSort.NameAToZ)
        return filtered?.sort((a, b) => {
          return (a.processedMetadata?.name ?? '') >
            (b.processedMetadata?.name ?? '')
            ? 1
            : -1
        })

      if (sortOption === CollectibleSort.NameZToA)
        return filtered?.sort((a, b) => {
          return (a.processedMetadata?.name ?? '') <
            (b.processedMetadata?.name ?? '')
            ? 1
            : -1
        })

      return filtered
    },
    [sortOption]
  )

  const filteredAndSorted = useMemo(() => {
    const filtered = getFiltered()
    return getSorted(filtered)
  }, [getFiltered, getSorted])

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const onRefresh = (): void => {
    refetch()
  }

  const onResetFilter = (): void => {
    setSelectedFilter({ section: 0, row: 0 })
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

    if (filter.selected.row !== 0)
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

  const headerStyle = useAnimatedStyle(() => {
    return {}
  })

  if (isLoading)
    return <LoadingState sx={{ height: portfolioTabContentHeight }} />

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
          <Animated.View
            style={[
              headerStyle,
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
          </Animated.View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.8}
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

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 343 / 424

export const NftListLoader = (): JSX.Element => {
  return (
    <View
      style={{
        alignItems: 'center',
        width: deviceWidth - 32,
        aspectRatio: aspectRatio,
        marginTop: 6
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 343 424"
        backgroundColor={'#1A1A1C'}
        foregroundColor={'#2A2A2D'}>
        <Rect x="0" y="0" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="72" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="144" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="216" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="288" rx="8" ry="8" width="343" height="64" />
        <Rect x="0" y="360" rx="8" ry="8" width="343" height="64" />
      </ContentLoader>
    </View>
  )
}
