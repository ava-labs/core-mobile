import { ScaledSize } from 'react-native'
import { CollectibleView } from 'store/balance'

export const HORIZONTAL_MARGIN = 16
export const HORIZONTAL_ITEM_GAP = 14
export const VERTICAL_ITEM_GAP = 12
export const LIST_CARD_HEIGHT = 64

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
