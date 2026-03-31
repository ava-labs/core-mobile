import { Dimensions } from 'react-native'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'

export const HORIZONTAL_MARGIN = 16
export const HORIZONTAL_ITEM_GAP = 14
export const VERTICAL_ITEM_GAP = 12
export const LIST_ITEM_HEIGHT = 64

const getWindowWidth = (): number => Dimensions.get('window').width
const getCompactGridCardMaxHeight = (): number =>
  getWindowWidth() - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3
const getLargeGridCardMaxHeight = (): number =>
  getWindowWidth() - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2

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
  const maxHeight = getCompactGridCardMaxHeight()
  if (index === 1 || (index % 5 === 0 && index > 0)) return maxHeight / 3
  if (index % 4 === 0) return maxHeight / 2
  return maxHeight / 2.5
}

export const getLargeGridCardHeight = (index: number): number => {
  const maxHeight = getLargeGridCardMaxHeight()
  if (index === 1 || (index % 5 === 0 && index > 0)) return maxHeight / 2
  if (index % 3 === 0 || index % 3 === 1) return maxHeight / 1.6
  return maxHeight / 1.8
}

export const getGridCardHeight = (
  type: CollectibleView,
  index: number
): number => {
  switch (type) {
    case CollectibleView.CompactGrid: {
      return getCompactGridCardHeight(index)
    }
    case CollectibleView.LargeGrid: {
      return getLargeGridCardHeight(index)
    }
    case CollectibleView.ListView:
    default: {
      return LIST_ITEM_HEIGHT
    }
  }
}
