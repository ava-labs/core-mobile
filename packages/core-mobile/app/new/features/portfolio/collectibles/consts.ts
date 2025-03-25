import {
  AssetNetworkFilter,
  CollectibleTypeFilter,
  CollectibleView
} from 'store/balance'
import { Dimensions } from 'react-native'
import { NftContentType } from 'store/nft'
import { ChainId } from '@avalabs/core-chains-sdk'
import { NftItem } from 'services/nft/types'

export const HORIZONTAL_MARGIN = 16
export const HORIZONTAL_ITEM_GAP = 14
export const VERTICAL_ITEM_GAP = 12
export const LIST_ITEM_HEIGHT = 64

const width = Dimensions.get('window').width
const COMPACT_GRID_CARD_HEIGHT =
  width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3
const LARGE_GRID_CARD_HEIGHT =
  width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2

export const getCollectibleName = (collectible: NftItem): string => {
  const fallback = collectible.name.length
    ? collectible.name
    : collectible.processedMetadata?.name.length
    ? collectible.processedMetadata?.name
    : ''
  return fallback?.length > 0 ? fallback.trim() : 'Untitled'
}

export const getCollectibleCollectionName = (collectible: NftItem): string => {
  const fallback = collectible.collectionName || ''

  return fallback.length === 0 || ['Unknown', 'Unkown'].includes(fallback)
    ? 'Unknown collection'
    : fallback.trim()
}

export const getCollectibleDescription = (collectible: NftItem): string => {
  const fallback =
    collectible.description || collectible.processedMetadata?.description || ''
  return fallback?.length > 0 ? fallback.trim() : 'No description'
}

export const getCompactGridCardHeight = (index: number): number => {
  if (index === 1 || (index % 5 === 0 && index > 0))
    return COMPACT_GRID_CARD_HEIGHT / 3
  if (index % 4 === 0) return COMPACT_GRID_CARD_HEIGHT / 2
  return COMPACT_GRID_CARD_HEIGHT / 2.5
}

export const getLargeGridCardHeight = (index: number): number => {
  if (index === 1 || (index % 5 === 0 && index > 0))
    return LARGE_GRID_CARD_HEIGHT / 2

  if (index % 3 === 0 || index % 3 === 1) return LARGE_GRID_CARD_HEIGHT / 1.6

  return LARGE_GRID_CARD_HEIGHT / 1.8
}

export const getGridCardHeight = (
  type: CollectibleView,
  index: number
): number => {
  switch (type) {
    case CollectibleView.ListView:
      return LIST_ITEM_HEIGHT
    case CollectibleView.CompactGrid: {
      return getCompactGridCardHeight(index)
    }
    case CollectibleView.LargeGrid: {
      return getLargeGridCardHeight(index)
    }
    default: {
      return LIST_ITEM_HEIGHT
    }
  }
}

export function getFilteredNetworks(
  items: NftItem[],
  network: AssetNetworkFilter
): NftItem[] {
  switch (network) {
    case AssetNetworkFilter.AvalancheCChain:
      return items.filter(
        collectible =>
          'chainId' in collectible &&
          (collectible.chainId === ChainId.AVALANCHE_MAINNET_ID ||
            collectible.chainId === ChainId.AVALANCHE_TESTNET_ID)
      )
    case AssetNetworkFilter.Ethereum:
      return items.filter(
        collectible =>
          'chainId' in collectible &&
          (collectible.chainId === ChainId.ETHEREUM_HOMESTEAD ||
            collectible.chainId === ChainId.ETHEREUM_TEST_GOERLY ||
            collectible.chainId === ChainId.ETHEREUM_TEST_SEPOLIA)
      )
    default:
      return items
  }
}

export function getFilteredContentType(
  items: NftItem[],
  contentType: CollectibleTypeFilter
): NftItem[] {
  switch (contentType) {
    case CollectibleTypeFilter.Videos:
      return items.filter(
        collectible => collectible.imageData?.type === NftContentType.MP4
      )
    case CollectibleTypeFilter.Pictures:
      return items.filter(
        collectible =>
          collectible.imageData?.type === NftContentType.JPG ||
          collectible.imageData?.type === NftContentType.PNG ||
          // try to display as picture if the type is unknown
          collectible.imageData?.type === NftContentType.Unknown
      )
    case CollectibleTypeFilter.GIFs:
      return items.filter(
        collectible => collectible.imageData?.type === NftContentType.GIF
      )
    default:
      return items
  }
}
