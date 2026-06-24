import { useEffect } from 'react'
import { router, useNavigation } from 'expo-router'
import { approvalController } from 'vmModule/ApprovalController/ApprovalController'

// Outlasts the sheet present animation (~0.5s on iOS) so a deferred dismiss is
// never issued mid-present (iOS drops those), yet guarantees we stop waiting on
// a `transitionEnd` that, for this nested-stack initial route, never arrives.
// (CP-14422)
const PRESENT_SETTLED_FALLBACK_MS = 700

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
 * Why we wait for the sheet to be "presented": on iOS the approval is a native
 * `formSheet`, and iOS silently drops a `router.back()` issued while that sheet
 * is still animating IN — the 0ms cross-origin case (sheet starts presenting,
 * the abort fires almost immediately, the pop is ignored, the defunct sheet
 * lingers). So we only dismiss once the present transition has finished: if the
 * abort lands first we defer; if the sheet is already presented we dismiss now.
 *
 * Why not transitionEnd alone: `ApprovalScreen` is the initial route of a nested
 * stack that its parent presents as a sheet, and that inner navigator does not
 * emit `transitionEnd` for its initial route (notably on Android), so the event
 * never fires and the deferred dismiss would hang forever. A fallback timer
 * sized to outlast the present animation marks the sheet presented regardless;
 * whichever fires first wins, the other no-ops. (CP-14422)
 *
 * Why the `isLedgerSigningInProgress` guard: once on-device Ledger signing has
 * begun, a cross-origin nav must NOT pop the review screen out from under a
 * signature the user is confirming on the device (the controller's settlement
 * already no-ops in that phase, and dismissal happens on settle). Mirrors the
 * same guard in `setCurrentUrl`'s `handleGoBackIfNeeded` call. (CP-14422)
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
      // Don't yank the sheet while signing on the device; the controller pops it
      // when the signature settles. Bail without latching `dismissed` so a later
      // settle/cancel can still dismiss through its own path.
      if (approvalController.isLedgerSigningInProgress()) return
      dismissed = true
      if (router.canGoBack()) router.back()
    }

    const markPresented = (): void => {
      if (presented) return
      presented = true
      if (abortedWhilePresenting) dismiss()
    }

    const onAbort = (): void => {
      // Wait for the present transition to settle before popping, so iOS doesn't
      // drop the pop mid-animation; otherwise dismiss now.
      if (!presented) {
        abortedWhilePresenting = true
        return
      }
      dismiss()
    }

    // transitionEnd is the fast path; the timer is the guarantee (see above).
    const unsubscribe = navigation.addListener(
      'transitionEnd' as never,
      markPresented as never
    )
    const fallback = setTimeout(markPresented, PRESENT_SETTLED_FALLBACK_MS)

    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })

    return () => {
      unsubscribe()
      clearTimeout(fallback)
      signal.removeEventListener('abort', onAbort)
    }
  }, [signal, navigation])
}
