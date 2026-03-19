import { useFocusEffect } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { useCallback, useRef } from 'react'

/** Native Stack `transitionEnd` payload. */
type TransitionEndPayload = {
  data?: { closing?: boolean }
}

/** Native Stack emits `transitionEnd`; root `NavigationProp` types omit it. */
type NavigationWithTransitionEnd = {
  addListener(
    event: 'transitionEnd',
    callback: (e: TransitionEndPayload) => void
  ): () => void
}

export type UseAfterScreenEnterTransitionOptions = {
  /** When false, the callback is not scheduled. Default: true */
  enabled?: boolean
  /**
   * If `transitionEnd` never fires (edge cases), run the callback after this delay (ms).
   * Set to `false` to disable. Default: 500
   */
  transitionFallbackMs?: number | false
  /**
   * Runs when the screen gains focus, before waiting for `transitionEnd`
   * (e.g. reset form state).
   */
  onScreenFocus?: () => void
}

/**
 * Runs `callback` once after this screen **finishes entering** the stack:
 * Native Stack `transitionEnd` with `closing !== true` (not the event where this screen is being removed).
 *
 * Use for e.g. focusing an input after navigating *to* this screen. Not for “screen is closing” transitions.
 * Only active while the screen is focused (`useFocusEffect`).
 *
 * The latest `callback` is always used (stored in a ref), so inline lambdas are OK.
 */
export function useAfterScreenEnterTransition(
  callback: () => void,
  options?: UseAfterScreenEnterTransitionOptions
): void {
  const navigation = useNavigation() as NavigationWithTransitionEnd
  const enabled = options?.enabled ?? true
  const fallbackMs = options?.transitionFallbackMs ?? 500
  const onScreenFocus = options?.onScreenFocus

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useFocusEffect(
    useCallback(() => {
      onScreenFocus?.()

      if (!enabled) {
        return undefined
      }

      let didRun = false
      const run = (): void => {
        if (didRun) return
        didRun = true
        callbackRef.current()
      }

      const onTransitionEnd = (e: TransitionEndPayload): void => {
        if (e.data?.closing === true) {
          return
        }
        run()
      }

      const unsubscribe = navigation.addListener(
        'transitionEnd',
        onTransitionEnd
      )

      let fallbackId: ReturnType<typeof setTimeout> | undefined
      if (fallbackMs !== false && fallbackMs > 0) {
        fallbackId = setTimeout(run, fallbackMs)
      }

      return () => {
        unsubscribe()
        if (fallbackId !== undefined) {
          clearTimeout(fallbackId)
        }
      }
    }, [enabled, fallbackMs, navigation, onScreenFocus])
  )
}
