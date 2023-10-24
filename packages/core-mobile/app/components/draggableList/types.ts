import React from 'react'

export interface DraggableListRenderItemInfo<ItemT> {
  item: ItemT
  index: number
}

export type DraggableRenderItem<TItem> = (
  info: DraggableListRenderItemInfo<TItem>
) => React.ReactElement | null

export type DragEndParams<TItem> = {
  newListOrder: TItem[]
}

export type ItemId = string
export type ItemPosition = number
