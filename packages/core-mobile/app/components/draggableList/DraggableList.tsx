import React, { useLayoutEffect, useMemo, useRef } from 'react'
import DraggableItemWrapper from 'components/draggableList/DraggableItemWrapper'
import {
  DragEndParams,
  DraggableRenderItem,
  ItemId,
  ItemPosition
} from 'components/draggableList/types'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated'
import Logger from 'utils/Logger'

const ITEM_HEIGHT = 60

interface Props<TItem> {
  data: ReadonlyArray<TItem>
  renderItem: DraggableRenderItem<TItem>
  keyExtractor: (item: TItem) => string
  onDragEnd: (dragEndParams: DragEndParams<TItem>) => void
  ListEmptyComponent:
    | React.ComponentType
    | React.ReactElement
    | null
    | undefined
}

const DraggableList = <TItem,>({
  data,
  renderItem,
  keyExtractor,
  onDragEnd,
  ListEmptyComponent
}: Props<TItem>): JSX.Element => {
  const scrollY = useSharedValue(0)
  const scrollViewOffset = useSharedValue(0)
  const positions = useSharedValue({} as Record<ItemId, ItemPosition>)
  const viewRef = useRef<Animated.ScrollView>(null)
  const dataRef = useRef<TItem[]>([])

  useMemo(() => {
    dataRef.current = [...data]
  }, [data])

  useLayoutEffect(() => {
    setTimeout(() => {
      // @ts-ignore
      // eslint-disable-next-line max-params
      viewRef.current?.measure?.((x, y, width, height, pageX, pageY) => {
        scrollViewOffset.value = pageY
      })
    }, 300)
  })

  positions.value = useMemo(() => {
    return data.reduce<Record<ItemId, ItemPosition>>((acc, item, index) => {
      acc[keyExtractor(item)] = index
      return acc
    }, {})
  }, [data, keyExtractor])

  const handleScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y
  })

  const handleDragFinish = (): void => {
    const newListOrder = new Array<TItem>(Object.keys(positions.value).length)
    Object.entries(positions.value).forEach(([itemId, position]) => {
      const item = dataRef.current.find(value => keyExtractor(value) === itemId)
      if (!item) {
        Logger.error(`No item for key ${itemId}`)
      } else {
        newListOrder[position] = item
      }
    })
    onDragEnd({ newListOrder })
  }

  function renderItems(): JSX.Element[] {
    return dataRef.current.map((item, index) => {
      const itemId = keyExtractor(item)
      return (
        <DraggableItemWrapper
          id={itemId}
          key={itemId}
          itemView={renderItem({ item, index })}
          height={ITEM_HEIGHT}
          scrollYShared={scrollY}
          scrollViewOffset={scrollViewOffset}
          positions={positions}
          onDragFinish={handleDragFinish}
        />
      )
    })
  }

  return (
    <>
      {dataRef.current.length === 0 ? (
        ListEmptyComponent
      ) : (
        <Animated.ScrollView
          key={data.length}
          ref={viewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            height: dataRef.current.length * ITEM_HEIGHT
          }}>
          {renderItems()}
        </Animated.ScrollView>
      )}
    </>
  )
}

export default DraggableList
