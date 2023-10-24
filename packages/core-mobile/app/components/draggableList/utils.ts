import { ItemId, ItemPosition } from 'components/draggableList/types'

export function clamp(value: number, lowerBound: number, upperBound: number) {
  'worklet'
  return Math.max(lowerBound, Math.min(value, upperBound))
}

export function objectMove(
  object: Record<ItemId, ItemPosition>,
  from: ItemPosition,
  to: ItemPosition
): Record<ItemId, ItemPosition> {
  'worklet'
  const newObj = Object.assign({}, object)
  for (const id in object) {
    if (object[id] === from) {
      newObj[id] = to
    }
    if (object[id] === to) {
      newObj[id] = from
    }
  }
  return newObj
}
