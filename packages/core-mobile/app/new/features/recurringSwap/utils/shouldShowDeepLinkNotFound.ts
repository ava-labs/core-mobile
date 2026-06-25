// Pure predicate for the deep-link "schedule not found" snackbar, extracted
// from RecurringSchedulesScreen so the branch logic is unit testable without
// rendering the screen (the effect's rAF/timeout/ref machinery makes a full
// render test brittle).
//
// A deep-linked orderId may not appear in the manageable list — the order could
// be cancelled / completed (filtered out), belong to a different account, or
// not exist on the active chain. We surface the snackbar exactly once, and only
// after a successful fetch (an error already renders the inline Retry CTA).
export function shouldShowDeepLinkNotFound({
  initialExpandedOrderId,
  isLoading,
  isError,
  alreadyShown,
  orderIds
}: {
  initialExpandedOrderId: string | undefined
  isLoading: boolean
  isError: boolean
  /** Caller's one-shot guard (the screen's `notFoundShownRef.current`). */
  alreadyShown: boolean
  /** orderIds of the currently manageable schedules. */
  orderIds: readonly string[]
}): boolean {
  if (!initialExpandedOrderId) return false
  // Wait for the fetch to settle; an error path shows the Retry CTA instead.
  if (isLoading || isError) return false
  if (alreadyShown) return false
  return !orderIds.includes(initialExpandedOrderId)
}
