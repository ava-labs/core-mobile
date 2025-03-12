import { CollectibleView } from 'store/balance'
import { Dimensions } from 'react-native'

export const HORIZONTAL_MARGIN = 16
export const HORIZONTAL_ITEM_GAP = 14
export const VERTICAL_ITEM_GAP = 12
export const LIST_ITEM_HEIGHT = 64

const width = Dimensions.get('window').width
const COMPACT_GRID_CARD_HEIGHT =
  width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3
const LARGE_GRID_CARD_HEIGHT =
  width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2

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
