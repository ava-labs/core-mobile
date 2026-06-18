import { useEffect } from 'react'
import { router } from 'expo-router'

/**
 * Dismiss the approval screen when its injected signing request is cancelled by
 * a cross-origin navigation (the request's `AbortSignal` fires).
 *
 * Why event-driven and not the generic `handleGoBackIfNeeded` pop in
 * `setCurrentUrl`: that pop is edge-triggered and gated on the route store's
 * `currentRoute`, which React Navigation updates asynchronously. The abort can
 * land before the screen mounts (pop fires too early, `currentRoute` not yet
 * `approval`) OR just after it mounts but before `currentRoute` catches up —
 * either way the pop misses and the defunct sheet lingers. Reacting to the
 * request's own signal dismisses regardless of timing, and is request-scoped
 * (never pops another request's sheet). `setCurrentUrl` excludes the `approval`
 * route from its pop so the two don't double `router.back()`. (CP-14422)
 */
export const useDismissOnCancelledRequest = (signal?: AbortSignal): void => {
  useEffect(() => {
    if (!signal) return

    let dismissed = false
    const dismiss = (): void => {
      if (dismissed) return
      dismissed = true
      if (router.canGoBack()) router.back()
    }

    // Aborted before the screen mounted — dismiss now; otherwise dismiss when it
    // aborts later.
    if (signal.aborted) {
      dismiss()
      return
    }
    signal.addEventListener('abort', dismiss, { once: true })
    return () => signal.removeEventListener('abort', dismiss)
  }, [signal])
}
