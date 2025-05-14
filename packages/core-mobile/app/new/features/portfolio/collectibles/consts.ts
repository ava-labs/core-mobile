import { Dimensions } from 'react-native'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'

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

export function getAttributes(
  collectible: NftItem | undefined
): { title: string; value: string }[] {
  if (
    collectible?.processedMetadata?.attributes === undefined ||
    collectible?.processedMetadata?.attributes.length === 0
  )
    return []

  if (Array.isArray(collectible.processedMetadata.attributes)) {
    return collectible.processedMetadata.attributes
      .map(item => {
        if (item.trait_type.length === 0 && item.value.length === 0) {
          return
        }
        return {
          title: capitalizeAndReplaceUnderscore(item.trait_type),
          value:
            item.display_type === 'date'
              ? getDateInMmmDdYyyyHhMmA(Number(item.value))
              : item.value
        }
      })
      .filter(item => item !== undefined)
  }

  if (typeof collectible.processedMetadata.attributes === 'object') {
    return Object.entries(collectible.processedMetadata.attributes).reduce(
      (acc, [key, value]) => {
        const stringValue = value as unknown as string
        if (key.length === 0 && stringValue.length === 0) {
          return acc
        }
        acc.push({
          title: capitalizeAndReplaceUnderscore(key),
          value: stringValue
        })
        return acc
      },
      [] as {
        title: string
        value: string
      }[]
    )
  }
  return []
}

function capitalizeAndReplaceUnderscore(str: string): string {
  return str.replace(/([A-Z])|_/g, ' $1').replace(/^./, function (str) {
    return str.toUpperCase().trim()
  })
}
