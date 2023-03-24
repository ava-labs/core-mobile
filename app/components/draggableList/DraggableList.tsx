import assert from 'assert'
import React, { useCallback, useMemo, useRef } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import DraggableItemWrapper from 'components/draggableList/DraggableItemWrapper'
import {
  DragEndParams,
  DraggableRenderItem,
  ItemId,
  ItemPosition
} from 'components/draggableList/types'
import Animated, { useSharedValue } from 'react-native-reanimated'

const ITEM_HEIGHT = 60

interface Props<TItem> {
  data: ReadonlyArray<TItem>
  renderItem: DraggableRenderItem<TItem>
  keyExtractor: (item: TItem) => string
  onDragEnd: (dragEndParams: DragEndParams<TItem>) => void
}

const DraggableList = <TItem,>({
  data,
  renderItem,
  keyExtractor,
  onDragEnd
}: Props<TItem>) => {
  const { theme } = useApplicationContext()
  const scrollViewOffset = useSharedValue(0)
  const positions = useSharedValue({} as Record<ItemId, ItemPosition>)
  const viewRef = useRef<Animated.ScrollView>(null)

  positions.value = useMemo(() => {
    return data.reduce<Record<ItemId, ItemPosition>>((acc, item, index) => {
      acc[keyExtractor(item)] = index
      return acc
    }, {})
  }, [data, keyExtractor])

  const handleDragFinish = useCallback(() => {
    const newListOrder = new Array<TItem>(Object.keys(positions.value).length)
    Object.entries(positions.value).forEach(([itemId, position]) => {
      const item = data.find(value => keyExtractor(value) === itemId)
      assert(item)
      newListOrder[position] = item
    })
    onDragEnd({ newListOrder })
  }, [data, keyExtractor, onDragEnd, positions])

  function renderItems() {
    return data.map(item => {
      const itemId = keyExtractor(item)
      return (
        <DraggableItemWrapper
          id={itemId}
          key={itemId}
          itemView={renderItem({ item })}
          height={ITEM_HEIGHT}
          scrollViewOffset={scrollViewOffset}
          positions={positions}
          onDragFinish={handleDragFinish}
        />
      )
    })
  }

  return (
    <Animated.ScrollView
      ref={viewRef}
      onLayout={() => {
        if (viewRef.current) {
          // @ts-ignore
          viewRef.current.measure((x, y, width, height, pageX, pageY) => {
            scrollViewOffset.value = pageY
          })
        }
      }}
      scrollEventThrottle={16}
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: theme.background
      }}
      contentContainerStyle={{ height: data.length * ITEM_HEIGHT }}>
      {renderItems()}
    </Animated.ScrollView>
  )
}

export default DraggableList
