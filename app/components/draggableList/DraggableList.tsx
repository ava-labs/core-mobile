import React from 'react'
import { ScrollView, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

export interface DraggableListRenderItemInfo<ItemT> {
  item: ItemT
  index: number
  drag: () => void
  isActive: boolean
}

export type DraggableRenderItem<TItem> = (
  info: DraggableListRenderItemInfo<TItem>
) => React.ReactElement | null

interface Props<TItem> {
  data: ReadonlyArray<TItem>
  renderItem: DraggableRenderItem<TItem>
}

const DraggableList = <TItem,>({ data, renderItem }: Props<TItem>) => {
  const { theme } = useApplicationContext()
  const ITEM_HEIGHT = 60

  function renderItems() {
    function drag() {
      console.log('not empty')
    }

    const isActive = false

    return data.map((item, index) => {
      return (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: index * ITEM_HEIGHT
          }}>
          {renderItem({
            item,
            index,
            drag,
            isActive
          } as DraggableListRenderItemInfo<TItem>)}
        </View>
      )
    })
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: theme.background
      }}
      contentContainerStyle={{ height: data.length * ITEM_HEIGHT }}>
      {renderItems()}
    </ScrollView>
  )
}

export default DraggableList
