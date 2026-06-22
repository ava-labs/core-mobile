import { useEffect } from 'react'
import { router, useNavigation } from 'expo-router'

/**
 * Dismiss the approval screen when its injected signing request is cancelled by
 * a cross-origin navigation (the request's `AbortSignal` fires).
 *
 * Why event-driven and not the generic `handleGoBackIfNeeded` pop in
 * `setCurrentUrl`: that pop is edge-triggered and gated on the route store's
 * `currentRoute`, which React Navigation updates asynchronously, so it races the
 * screen's mount and misses. Reacting to the request's own signal dismisses
 * regardless of timing and is request-scoped (never pops another request's
 * sheet). `setCurrentUrl` excludes the `approval` route so the two don't double
 * `router.back()`. (CP-14422)
 *
 * Why gated on `transitionEnd`: on iOS the approval is a native `formSheet`, and
 * iOS silently drops a `router.back()` issued while that sheet is still
 * animating IN — the exact 0ms cross-origin case (sheet starts presenting, the
 * abort fires almost immediately, the pop is ignored, the defunct sheet
 * lingers). We therefore only dismiss once the present transition has finished:
 * if the abort lands first we defer to the next `transitionEnd`; if the sheet is
 * already presented we dismiss immediately. (CP-14422)
 */
export const useDismissOnCancelledRequest = (signal?: AbortSignal): void => {
  const navigation = useNavigation()

  useEffect(() => {
    if (!signal) return

    let dismissed = false
    let presented = false
    let abortedWhilePresenting = false

    const dismiss = (): void => {
      if (dismissed) return
      dismissed = true
      if (router.canGoBack()) router.back()
    }

    const onAbort = (): void => {
      // Dismiss now if the sheet has finished presenting; otherwise wait for the
      // present transition to end so iOS doesn't drop the pop mid-animation.
      if (presented) dismiss()
      else abortedWhilePresenting = true
    }

    // The first transitionEnd after mount marks the present animation complete.
    const unsubscribe = navigation.addListener(
      'transitionEnd' as never,
      (() => {
        presented = true
        if (abortedWhilePresenting) dismiss()
      }) as never
    )

    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })

    return () => {
      unsubscribe()
      signal.removeEventListener('abort', onAbort)
    }
  }, [signal, navigation])
}
