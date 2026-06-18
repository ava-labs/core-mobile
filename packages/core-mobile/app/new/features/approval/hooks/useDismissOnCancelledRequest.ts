import { useEffect } from 'react'
import { router } from 'expo-router'

/**
 * Dismiss the approval screen on mount if its injected signing request was
 * already cancelled by a cross-origin navigation.
 *
 * A cross-origin nav aborts + settles the request and fires the generic
 * `handleGoBackIfNeeded` pop in `setCurrentUrl`. But that pop can run in the
 * window between `router.navigate('/approval')` and this screen actually
 * mounting (the route's `currentRoute` is set asynchronously), so it misses and
 * the defunct sheet lingers. Reacting to the request's own `AbortSignal` makes
 * dismissal request-scoped (never pops another request's sheet) and robust to
 * that mount-vs-pop race.
 *
 * Mount-time only by design: a nav that aborts the request while this screen is
 * already mounted is handled by `setCurrentUrl`'s pop (the screen is the current
 * route, so it lands), and adding a live `abort` listener here would race that
 * pop into a double `router.back()`. (CP-14422)
 */
export const useDismissOnCancelledRequest = (signal?: AbortSignal): void => {
  useEffect(() => {
    if (signal?.aborted && router.canGoBack()) {
      router.back()
    }
    // Run once on mount for this request's signal; see docblock for why we don't
    // subscribe to later aborts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
