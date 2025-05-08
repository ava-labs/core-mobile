import { SCREEN_WIDTH } from '@avalabs/k2-alpine'
import React, { ReactNode, useRef } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'

export const EdgeGesture = ({
  onGesture,
  distance = 50,
  velocity = 500,
  direction = 'left',
  children,
  enabled = true
}: {
  onGesture: (direction: 'left' | 'right') => void
  distance?: number
  velocity?: number
  direction: 'left' | 'right' | 'left-and-right'
  children: ReactNode
  enabled?: boolean
}): ReactNode => {
  const allowGesture = useRef(false)

  const gesture = Gesture.Pan()
    .onTouchesDown(event => {
      const startX = event.allTouches[0]?.x
      if (!startX) return
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
    })
    .onUpdate(() => {
      // gesture gets rejected automatically if not started within bounds
      if (!allowGesture.current) return
    })
    .onEnd(event => {
      const { translationX, velocityX } = event
      if (!allowGesture.current) return

      if (translationX > distance && velocityX > velocity) {
        runOnJS(onGesture)('left')
      }
      if (translationX < -distance && velocityX < -velocity) {
        runOnJS(onGesture)('right')
      }
    })
    .maxPointers(1)
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .enabled(enabled)

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>
}
