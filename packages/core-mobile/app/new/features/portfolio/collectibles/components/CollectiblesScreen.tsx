import {
  alpha,
  AnimatedPressable,
  Icons,
  IndexPath,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { RefreshControl } from 'components/RefreshControl'
import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  Platform,
  ScaledSize,
  useWindowDimensions,
  ViewStyle
} from 'react-native'
// import { MasonryFlashList } from 'react-native-collapsible-tab-view'
import { ChainId } from '@avalabs/core-chains-sdk'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { AssetsHeader } from 'features/portfolio/assets/components/AssetsHeader'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
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
import { ContentRenderer } from './ContentRenderer'

const HORIZONTAL_MARGIN = 16
const HORIZONTAL_ITEM_GAP = 14
const VERTICAL_ITEM_GAP = 12
const LIST_CARD_HEIGHT = 64

export const getGridCardHeight = (
  type: CollectibleView,
  dimensions: ScaledSize,
  index: number
): number => {
  switch (type) {
    case CollectibleView.ListView:
      return LIST_CARD_HEIGHT
    case CollectibleView.CompactGrid: {
      if (index === 1 || (index % 5 === 0 && index > 0))
        return (
          (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3) / 3
        )
      if (index % 4 === 0) {
        return (
          (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3) / 2
        )
      }
      return (
        (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3) / 2.5
      )
    }
    case CollectibleView.LargeGrid: {
      if (index === 1 || (index % 5 === 0 && index > 0))
        return (
          (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2) / 2
        )

      if (index % 3 === 0 || index % 3 === 1)
        return (
          (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2) / 1.6
        )

      return (
        (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2) / 1.8
      )
    }
    default: {
      return LIST_CARD_HEIGHT
    }
  }
}

function useCollectibles(): {
  data: NFTItem[]
  filter: Selection
  sort: Selection
  view: Selection
  isLoading: boolean
  isRefetching: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  refetch: () => void
  fetchNextPage: () => void
} {
  const {
    collectibles,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
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

  return {
    data: filteredAndSorted,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    isLoading,
    refetch,
    fetchNextPage,
    filter: {
      title: 'Filter',
      data: COLLECTIBLE_NETWORK_FILTERS,
      selected: selectedFilter,
      onSelected: setSelectedFilter
    },
    sort: {
      title: 'Sort',
      data: COLLECTIBLE_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    },
    view: {
      title: 'View',
      data: COLLECTIBLE_VIEWS,
      selected: selectedView,
      onSelected: setSelectedView
    }
  }
}

export type Selection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}

export const CollectiblesScreen = (): JSX.Element => {
  const dimensions = useWindowDimensions()
  const {
    view,
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    filter,
    sort,
    fetchNextPage,
    refetch
  } = useCollectibles()

  const listType = view.data[0]?.[view.selected.row] as CollectibleView

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const renderItem: ListRenderItem<NFTItem> = ({ item, index }) => {
    return (
      <CollectibleGridItem collectible={item} index={index} type={listType} />
    )
  }

  const renderEmpty = (): JSX.Element => {
    return <EmptyCollectibles />
  }

  const handleManageList = useCallback(
    (indexPath: IndexPath): void => {
      const manageList =
        ASSET_MANAGE_VIEWS?.[indexPath.section]?.[indexPath.row]
      if (manageList === AssetManageView.ManageList) {
        // goToTokenManagement()
        return
      }
      view.onSelected(indexPath)
    },
    [view]
  )

  const renderHeader = useMemo(() => {
    return (
      <View
        sx={{
          alignSelf: 'center',
          marginBottom: 8,
          width: dimensions.width - HORIZONTAL_MARGIN * 2
        }}>
        <AssetsHeader
          filter={filter}
          sort={sort}
          view={{ ...view, onSelected: handleManageList }}
        />
      </View>
    )
  }, [dimensions.width, filter, sort, view, handleManageList])

  if (isLoading)
    return <View sx={{ paddingHorizontal: 16 }}>{/* <NftListLoader /> */}</View>

  return (
    <CollapsibleTabs.MasonryList
      key={`collectibles-list-${listType}`}
      extraData={{
        listType,
        sort,
        filter
      }}
      data={data}
      keyExtractor={(item: NFTItem) => `collectibles-list-${item.uid}`}
      renderItem={renderItem}
      numColumns={
        listType === CollectibleView.CompactGrid
          ? 3
          : listType === CollectibleView.LargeGrid
          ? 2
          : 1
      }
      estimatedItemSize={180}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      scrollEnabled={data?.length > 0}
      removeClippedSubviews={Platform.OS === 'android'}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={renderHeader}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
      }
      style={{
        overflow: 'visible'
      }}
      contentContainerStyle={{
        padding: data?.length ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2 : 0,
        paddingTop: HORIZONTAL_MARGIN + 4,
        paddingBottom: HORIZONTAL_MARGIN
      }}
    />
  )
}

const CollectibleGridItem = ({
  collectible,
  type,
  index
}: {
  collectible: NFTItem
  type: CollectibleView
  index: number
}): JSX.Element | JSX.Element[] => {
  const {
    theme: { isDark, colors }
  } = useTheme()
  const dimensions = useWindowDimensions()
  const height = getGridCardHeight(type, dimensions, index)

  if (type === CollectibleView.ListView) {
    return (
      <Animated.View
        entering={getListItemEnteringAnimation(0)}
        layout={LinearTransition.springify()}>
        <Pressable
          style={{
            height,
            marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
            flexDirection: 'row',
            alignItems: 'center',
            gap: HORIZONTAL_ITEM_GAP
          }}>
          <CardContainer
            style={{
              height: 48,
              width: 48,
              borderRadius: 12
            }}>
            <ContentRenderer
              imageUrl={collectible.imageData?.image}
              videoUrl={collectible.imageData?.image}
            />
          </CardContainer>
          <View
            style={{
              flex: 1,
              height: '100%',
              borderBottomWidth: 0.5,
              borderColor: '#CCCCCC',
              alignItems: 'center',
              flexDirection: 'row',
              gap: HORIZONTAL_ITEM_GAP
            }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignItems: 'center'
              }}>
              <View>
                <Text variant="buttonMedium" numberOfLines={1}>
                  {collectible.tokenId ?? 'TokenId'}
                </Text>
                <Text
                  variant="subtitle2"
                  numberOfLines={1}
                  style={{
                    color: alpha(isDark ? '#FFFFFF' : '#1E1E24', 0.6)
                  }}>
                  {collectible.processedMetadata?.name ?? 'Collectible Name'}
                </Text>
              </View>
              <AnimatedPressable>
                <Pill text="123" />
              </AnimatedPressable>
            </View>
            <Icons.Navigation.ChevronRightV2
              color={colors.$textSecondary}
              style={{
                marginRight: -4
              }}
            />
          </View>
        </Pressable>
      </Animated.View>
    )
  }

  return (
    <AnimatedPressable
      entering={getListItemEnteringAnimation(index)}
      layout={LinearTransition.springify()}>
      <CardContainer
        style={{
          height,
          marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
          marginVertical: VERTICAL_ITEM_GAP / 2
        }}>
        <AnimatedPressable
          style={{
            position: 'absolute',
            zIndex: 1,
            right: HORIZONTAL_MARGIN,
            top: HORIZONTAL_MARGIN
          }}>
          <Pill text="123" />
        </AnimatedPressable>

        <ContentRenderer
          imageUrl={collectible.imageData?.image}
          videoUrl={collectible.imageData?.image}
        />
      </CardContainer>
    </AnimatedPressable>
  )
}

const Pill = ({ text }: { text: string }): JSX.Element => {
  return (
    <View
      style={{
        backgroundColor: alpha('#58585B', 0.8),
        borderRadius: 100,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      <Icons.Content.Close />
      <Text
        variant="buttonSmall"
        sx={{ lineHeight: 20, color: '$surfacePrimary' }}
        numberOfLines={1}>
        {text}
      </Text>
    </View>
  )
}

const CardContainer = ({
  style,
  children
}: {
  style: ViewStyle
  children?: ReactNode
}): JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  return (
    <View
      style={{
        height: 220,
        backgroundColor: alpha(isDark ? '#3F3F42' : '#F6F6F6', 0.8),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: alpha(isDark ? '#fff' : '#000', 0.1),
        borderRadius: 18,
        ...style
      }}>
      {children}
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
