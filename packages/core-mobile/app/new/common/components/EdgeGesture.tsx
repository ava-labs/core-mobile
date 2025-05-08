import { alpha, SCREEN_WIDTH, useTheme, View } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback, useRef } from 'react'
import { Platform } from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
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
   * **Android Only**
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
  const { theme } = useTheme()
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

  const renderEdgeOverlay = useCallback((): ReactNode => {
    if (Platform.OS === 'ios' || !showEdgeOverlay) return null

    const leftEdgeOverlay = (
      <View
        pointerEvents="auto"
        style={{
          position: 'absolute',
          width: distance,
          left: 0,
          top: 0,
          bottom: 0,
          // This is a hack to make the overlay work on Android
          backgroundColor: alpha(theme.colors.$surfacePrimary, 0.005)
        }}
      />
    )

    const rightEdgeOverlay = (
      <View
        pointerEvents="auto"
        style={{
          position: 'absolute',
          width: distance,
          right: 0,
          top: 0,
          bottom: 0,
          // This is a hack to make the overlay work on Android
          backgroundColor: alpha(theme.colors.$surfacePrimary, 0.005)
        }}
      />
    )

    if (direction === 'left') return leftEdgeOverlay
    if (direction === 'right') return rightEdgeOverlay
    if (direction === 'left-and-right')
      return (
        <>
          {leftEdgeOverlay}
          {rightEdgeOverlay}
        </>
      )
  }, [direction, distance, showEdgeOverlay, theme.colors.$surfacePrimary])

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
