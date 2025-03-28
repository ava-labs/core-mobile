import { Dimensions } from 'react-native'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'

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
  const fallbackWithoutTokenId = fallback.replace(/#\d+/g, '')

  return fallbackWithoutTokenId?.length > 0
    ? fallbackWithoutTokenId.trim()
    : 'Untitled'
}

export const getCollectibleCollectionName = (collectible: NftItem): string => {
  const fallback = collectible.collectionName || ''

  return `#${collectible.tokenId} ${
    fallback.length === 0 || ['Unknown', 'Unkown'].includes(fallback)
      ? 'Unknown collection'
      : fallback.trim()
  }`
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

export function camelCaseToTitle(text: string): string {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
    return str.toUpperCase().trim()
  })
}

export const formatAddress = (address?: string): string => {
  if (!address) return ''
  return `${address?.substring(0, 6)}...${address?.substring(
    address?.length - 4
  )}`
}
