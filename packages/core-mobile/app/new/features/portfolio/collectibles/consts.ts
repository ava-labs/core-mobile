import { CollectibleView } from 'store/balance'
import { Dimensions } from 'react-native'

export const HORIZONTAL_MARGIN = 16
export const HORIZONTAL_ITEM_GAP = 14
export const VERTICAL_ITEM_GAP = 12
export const LIST_ITEM_HEIGHT = 64

export const getCompactGridCardHeight = (
  width: number,
  index: number
): number => {
  if (index === 1 || (index % 5 === 0 && index > 0))
    return (width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3) / 3
  if (index % 4 === 0)
    return (width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3) / 2
  return (width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3) / 2.5
}

export const getLargeGridCardHeight = (
  width: number,
  index: number
): number => {
  if (index === 1 || (index % 5 === 0 && index > 0))
    return (width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2) / 2

  if (index % 3 === 0 || index % 3 === 1)
    return (width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2) / 1.6

  return (width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 2) / 1.8
}

export const getGridCardHeight = (
  type: CollectibleView,
  index: number
): number => {
  const width = Dimensions.get('window').width
  switch (type) {
    case CollectibleView.ListView:
      return LIST_ITEM_HEIGHT
    case CollectibleView.CompactGrid: {
      return getCompactGridCardHeight(width, index)
    }
    case CollectibleView.LargeGrid: {
      return getLargeGridCardHeight(width, index)
    }
    default: {
      return LIST_ITEM_HEIGHT
    }
  }
}
