import { SCREEN_WIDTH, View } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback, useRef } from 'react'
import { Platform } from 'react-native'
import {
  ComposedGesture,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureType
} from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'

interface EdgeGestureProps {
  onGesture: (direction: 'left' | 'right') => void
  distance?: number
  direction: 'left' | 'right' | 'left-and-right'
  children: ReactNode
  enabled?: boolean
  /**
   * Some ScrollViews/FlatLists inside third party libraries don't work with the gesture handler
   * so we need to show an overlay to allow the user to trigger the gesture
   *
   * @platform Android - necessary for third party libraries (ex: WebView)
   */
  showEdgeOverlay?: boolean
}

/**
 * Allows the user to trigger a gesture by swiping from the edge of the screen
 *
 * **Note:** child FlatList/ScrollView should be imported from 'react-native-gesture-handler' for compatibility
 */
export const EdgeGesture = ({
  onGesture,
  distance = 50,
  direction = 'left',
  children,
  enabled = true,
  showEdgeOverlay
}: EdgeGestureProps): ReactNode => {
  const allowGesture = useRef(false)
  const startPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const gesture = Gesture.Pan()
    .onTouchesDown(event => {
      const startX = event.allTouches[0]?.x
      const startY = event.allTouches[0]?.y
      if (!startX || !startY) return

      if (
        (direction === 'left' && startX <= distance) ||
        (direction === 'right' && startX >= SCREEN_WIDTH - distance) ||
        (direction === 'left-and-right' &&
          (startX <= distance || startX >= SCREEN_WIDTH - distance))
      ) {
        allowGesture.current = true
      } else {
        allowGesture.current = false
      }
      startPosition.current = { x: startX, y: startY }
    })
    .onTouchesUp(event => {
      const currentX = event.allTouches[0]?.x
      if (!currentX) return
      if (!allowGesture.current) return

      const translationX = currentX - startPosition.current.x

      if (translationX > distance) {
        runOnJS(onGesture)('left')
      }
      if (translationX < -distance) {
        runOnJS(onGesture)('right')
      }
    })
    .maxPointers(1)
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .enabled(enabled)

  const edgeGesture = Gesture.Pan()
    .onTouchesDown(event => {
      const startX = event.allTouches[0]?.x
      const startY = event.allTouches[0]?.y
      if (!startX || !startY) return

      if (
        (direction === 'left' && startX <= distance) ||
        (direction === 'right' && startX >= SCREEN_WIDTH - distance) ||
        (direction === 'left-and-right' &&
          (startX <= distance || startX >= SCREEN_WIDTH - distance))
      ) {
        allowGesture.current = true
        startPosition.current = { x: startX, y: startY }
      } else {
        allowGesture.current = false
      }
    })
    .onTouchesUp(event => {
      const currentX = event.allTouches[0]?.x
      if (!currentX) return
      if (!allowGesture.current) return

      const translationX = currentX - startPosition.current.x

      if (translationX > distance) {
        runOnJS(onGesture)('left')
      }
      if (translationX < -distance) {
        runOnJS(onGesture)('right')
      }
    })
    .maxPointers(1)
    .failOffsetY([-10, 10])
    .runOnJS(true)

  const renderEdgeOverlay = useCallback((): ReactNode => {
    // Android only
    if (Platform.OS === 'ios' || !showEdgeOverlay) return null

    if (direction === 'left')
      return <Edge gesture={edgeGesture} position="left" distance={distance} />
    if (direction === 'right')
      return <Edge gesture={edgeGesture} position="right" distance={distance} />
    if (direction === 'left-and-right')
      return (
        <>
          <Edge gesture={edgeGesture} position="left" distance={distance} />
          <Edge gesture={edgeGesture} position="right" distance={distance} />
        </>
      )
  }, [direction, distance, edgeGesture, showEdgeOverlay])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <View style={{ flex: 1 }}>
          {children}
          {renderEdgeOverlay()}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

const Edge = ({
  position,
  distance,
  gesture
}: {
  position: 'left' | 'right'
  distance: number
  gesture: ComposedGesture | GestureType
}): ReactNode => (
  <GestureDetector gesture={gesture}>
    <View
      pointerEvents="box-only"
      style={{
        position: 'absolute',
        width: distance,
        [position]: 0,
        top: 0,
        bottom: 0
      }}
    />
  </GestureDetector>
)
