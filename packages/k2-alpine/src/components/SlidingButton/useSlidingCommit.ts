import { useCallback, useEffect, useRef, useState } from 'react'
import { SharedValue, withTiming } from 'react-native-reanimated'
import { ANIMATED } from '../../utils/animations'
import { ERROR_RESET_MS } from './constants'
import { fireErrorHaptic, fireSuccessHaptic } from './haptics'
import type { SlideState, SlidingButtonProps } from './types'

export const useSlidingCommit = (
  props: SlidingButtonProps,
  translateX: SharedValue<number>
): {
  state: SlideState
  handleCommit: (side: 'left' | 'right') => Promise<void>
} => {
  const [state, setState] = useState<SlideState>('idle')
  const isMountedRef = useRef(true)
  // `handleCommit` is passed into `Gesture.Pan().onEnd(...runOnJS(handleCommit))`
  // and re-created every render would reattach the gesture. Reading the current
  // props through a ref keeps the callback stable.
  const propsRef = useRef(props)
  propsRef.current = props
  // Guards against a second commit firing before the first settles. The
  // gesture handler already guards via `state === 'idle'` but state updates are
  // async, so a second onEnd within the same tick could slip through.
  const inFlightRef = useRef(false)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleCommit = useCallback(
    async (side: 'left' | 'right'): Promise<void> => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      setState('confirming')
      try {
        const current = propsRef.current
        if (current.mode === 'single') {
          await current.onConfirm()
        } else if (side === 'left') {
          await current.onConfirmLeft()
        } else {
          await current.onConfirmRight()
        }
        // Success haptic fires only after the caller's confirm resolves, so a
        // rejected promise doesn't produce a success buzz followed by an error
        // buzz. Haptic failures are swallowed inside the helper so they can't
        // influence the commit lifecycle.
        await fireSuccessHaptic()
        if (isMountedRef.current) {
          translateX.value = withTiming(0, ANIMATED.TIMING_CONFIG)
          setState('idle')
        }
      } catch (error) {
        propsRef.current.onError?.(error)
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[SlidingButton] commit rejected:', error)
        }
        if (isMountedRef.current) {
          await fireErrorHaptic()
          setState('error')
          translateX.value = withTiming(0, ANIMATED.TIMING_CONFIG)
          setTimeout(() => {
            if (isMountedRef.current) setState('idle')
          }, ERROR_RESET_MS)
        }
      } finally {
        inFlightRef.current = false
      }
    },
    [translateX]
  )

  return { state, handleCommit }
}
