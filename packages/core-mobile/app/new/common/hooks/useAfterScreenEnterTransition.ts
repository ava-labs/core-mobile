import { useFocusEffect } from 'expo-router'
import { useNavigation } from 'expo-router'
import { useCallback, useRef } from 'react'
import { Platform } from 'react-native'

/**
 * Recommended `layoutBufferMs` for **iOS** when this screen is presented as a form sheet / stack
 * modal and you auto-focus a `TextInput` (or similar) in the hook callback.
 *
 * - **iOS:** `500` — native layout and the keyboard often settle in a second pass after
 *   `transitionEnd`. Calling `focus()` immediately can race that pass and look like the keyboard
 *   opening twice, or the field/keyboard fighting the sheet’s safe-area layout.
 * - **Android:** `0` — no extra wait; pass this value as-is so call sites can use
 *   `layoutBufferMs: FORM_SHEET_FOCUS_BUFFER_MS` without branching on platform.
 *
 * Omit `layoutBufferMs` entirely when you do not need this (no focus, or no double-keyboard issue).
 */
export const FORM_SHEET_FOCUS_BUFFER_MS = Platform.OS === 'ios' ? 500 : 0

type TransitionEndPayload = {
  data?: { closing?: boolean }
}

/** Native stack `transitionEnd` is not on shared `NavigationProp` types. */
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
   * Fallback **time cap** (ms) for running the callback if `transitionEnd` is delayed or never
   * fires. The callback will run after this fixed delay unless `false` is passed, even if
   * `transitionEnd` later fires on a slower / longer transition. Set to `false` to disable.
   * Default: 500.
   */
  transitionFallbackMs?: number | false
  /**
   * Runs when the screen gains focus, before waiting for `transitionEnd`
   * (e.g. reset form state).
   */
  onScreenFocus?: () => void
  /**
   * Optional **wall-clock delay** (milliseconds) after the screen is considered entered
   * (`transitionEnd`, or `transitionFallbackMs`) and **before** the hook runs your callback.
   *
   * **When to use:** You usually need this on **iOS** when the callback shows the keyboard — e.g.
   * `TextInput.focus()` — on a **form sheet** or other native-stack modal. In those cases, layout
   * and keyboard animation can still run for a short time after `transitionEnd`. If you focus too
   * early, you may see:
   * - the keyboard appearing to **open twice** or “bounce”,
   * - the input and sheet **re-layouting** in two steps,
   * - or odd safe-area / scroll inset behavior.
   *
   * **What to pass:** Use **`layoutBufferMs: FORM_SHEET_FOCUS_BUFFER_MS`** for that pattern; it is
   * `500` on iOS and `0` on Android so call sites stay a single line. You can pass another positive
   * number if a specific flow still glitches. Omit this option (or use `0`) when you do not focus
   * inputs or you do not observe the issue.
   */
  layoutBufferMs?: number
}

/**
 * Runs `callback` once after the screen is considered to have **entered** the native stack —
 * whichever happens first: the native `transitionEnd` event or the `transitionFallbackMs`
 * timeout (if enabled). Optionally waits `layoutBufferMs` before invoking.
 *
 * `navigation` is kept in a ref so a changing reference does not re-subscribe while focused (that
 * could miss `transitionEnd` and fire the fallback twice). `callback` uses a ref for fresh closures.
 * Stabilize `onScreenFocus` with `useCallback` when possible.
 */
export function useAfterScreenEnterTransition(
  callback: () => void,
  options?: UseAfterScreenEnterTransitionOptions
): void {
  const navigation = useNavigation() as NavigationWithTransitionEnd
  const enabled = options?.enabled ?? true
  const fallbackMs = options?.transitionFallbackMs ?? 500
  const onScreenFocus = options?.onScreenFocus
  const layoutBufferMs = options?.layoutBufferMs

  const navigationRef = useRef(navigation)
  navigationRef.current = navigation

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useFocusEffect(
    useCallback(() => {
      onScreenFocus?.()

      if (!enabled) {
        return undefined
      }

      let didRun = false
      let fallbackId: ReturnType<typeof setTimeout> | undefined
      let bufferId: ReturnType<typeof setTimeout> | undefined
      let unsubscribe: (() => void) | undefined

      const cancelAll = (): void => {
        if (fallbackId !== undefined) {
          clearTimeout(fallbackId)
          fallbackId = undefined
        }
        if (bufferId !== undefined) {
          clearTimeout(bufferId)
          bufferId = undefined
        }
        unsubscribe?.()
        unsubscribe = undefined
      }

      const runOnce = (): void => {
        if (didRun) {
          return
        }
        didRun = true
        cancelAll()
        if (layoutBufferMs !== undefined && layoutBufferMs > 0) {
          bufferId = setTimeout(() => {
            bufferId = undefined
            callbackRef.current()
          }, layoutBufferMs)
        } else {
          callbackRef.current()
        }
      }

      unsubscribe = navigationRef.current.addListener(
        'transitionEnd',
        (e: TransitionEndPayload) => {
          if (e.data?.closing === true) {
            return
          }
          runOnce()
        }
      )

      if (fallbackMs !== false && fallbackMs > 0) {
        fallbackId = setTimeout(runOnce, fallbackMs)
      }

      return cancelAll
    }, [enabled, fallbackMs, layoutBufferMs, onScreenFocus])
  )
}
