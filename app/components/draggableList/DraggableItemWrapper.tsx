import React, { ReactElement, useState } from 'react'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { PanGestureHandler } from 'react-native-gesture-handler'
import { ItemId, ItemPosition } from 'components/draggableList/types'
import { Row } from 'components/Row'
import DragHandleSVG from 'components/svg/DragHandleSVG'
import { clamp, objectMove } from 'components/draggableList/utils'

type Props = {
  id: ItemId
  height: number
  scrollViewOffset: SharedValue<number>
  positions: SharedValue<Record<ItemId, ItemPosition>>
  onDragFinish: () => void
  itemView: ReactElement | null
}

/**
 * DraggableItemWrapper adds handle icon to the list item view and handles gestures to animate dragging.
 * @param id Id of wrapped item
 * @param height Height of for calculation of new item position while dragging
 * @param scrollViewOffset Since this wrapper is placed 'absolutely' it needs to take into account absolute position of parent scroll view
 * @param positions Shared record of all sibling items including this one
 * @param onDragFinish Callback when dragging finishes
 * @param itemView View to wrap
 * @constructor
 */
const DraggableItemWrapper = ({
  id,
  height,
  scrollViewOffset,
  positions,
  onDragFinish,
  itemView
}: Props) => {
  const [dragging, setDragging] = useState(false)
  const top = useSharedValue(0)

  // this hook does 2 things:
  // 1. on initial render, move the item to correct position
  //
  // 2. whenever item position changes while it is not being dragged
  // it means that the user is dragging another item in the list over this item
  // when this happens, we move the item to the new position
  useAnimatedReaction(
    () => positions.value[id],
    (currentPos, previousPos) => {
      if (currentPos !== undefined && currentPos !== previousPos) {
        if (!dragging) {
          const itemTop = currentPos * height
          top.value = withSpring(itemTop)
        }
      }
    },
    [dragging]
  )

  const gestureHandler = useAnimatedGestureHandler(
    {
      onStart() {
        runOnJS(setDragging)(true)
      },
      onActive(event) {
        const posYRelative = event.absoluteY - scrollViewOffset.value

        // update item top value
        top.value = posYRelative - height / 2

        // get new position
        const newPosition = clamp(
          Math.floor(posYRelative / height),
          0,
          Object.keys(positions.value).length - 1
        )

        // update positions of all affected items
        if (newPosition !== (positions.value[id] ?? 0)) {
          positions.value = objectMove(
            positions.value,
            positions.value[id] ?? 0,
            newPosition
          )
        }
      },
      onFinish() {
        // when dragging ends, we move item to the correct position (a multiplier of item height)
        const newPosition = positions.value[id] ?? 0
        const itemTop = newPosition * height
        top.value = withSpring(itemTop)

        runOnJS(setDragging)(false)
        runOnJS(onDragFinish)()
      }
    },
    [height]
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      zIndex: dragging ? 1 : 0,
      shadowOpacity: withSpring(dragging ? 0.5 : 0),
      elevation: dragging ? 10 : 0,
      top: top.value
    }
  }, [dragging])

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          backgroundColor: 'black',
          shadowOffset: { width: 0, height: 0 },
          shadowColor: 'white',
          shadowRadius: 6
        },
        animatedStyle
      ]}>
      <Row style={{ alignItems: 'center' }}>
        {itemView}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            style={{
              padding: 16,
              marginLeft: -16
            }}>
            <DragHandleSVG />
          </Animated.View>
        </PanGestureHandler>
      </Row>
    </Animated.View>
  )
}

export default DraggableItemWrapper
