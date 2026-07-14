import { isCancelledError } from '@tanstack/react-query'
import Logger from 'utils/Logger'

/**
 * Bounded so a pathological session (e.g. hundreds of distinct failing
 * queries) can't grow memory unbounded; beyond the cap every failure is
 * reported, which simply reverts to the pre-dedupe behavior.
 */
const MAX_TRACKED_ERRORS = 200

const reportedErrors = new Set<string>()

/**
 * Global QueryCache error handler.
 *
 * Reports each unique (query, error message) pair once per session at error
 * level (which reaches Sentry via Logger.error) and downgrades repeats to
 * warn. Recurring background polls against a persistently failing endpoint
 * otherwise emit an identical Sentry event on every poll cycle — the
 * "Failed to fetch supported chains" issue accumulated 200k+ events this
 * way (CP-14759).
 *
 * The CancelledError guard is defensive only: in the current react-query
 * version the query filters cancellations before invoking QueryCache
 * onError, but that's an internal detail a version bump could change —
 * and this handler is the gateway to Sentry.
 */
export const onQueryError = (
  error: Error,
  query: { queryHash: string }
): void => {
  if (isCancelledError(error)) return

  // Defensive: queryFns can reject with non-Error values despite the type.
  const message = error instanceof Error ? error.message : String(error)
  const key = `${query.queryHash}:${message}`

  if (reportedErrors.has(key)) {
    Logger.warn('[ReactQueryProvider] Query error (repeat)', error)
    return
  }

  if (reportedErrors.size < MAX_TRACKED_ERRORS) {
    reportedErrors.add(key)
  }

  Logger.error('[ReactQueryProvider] Query error', error)
}

/**
 * Test-only: clears the once-per-session dedupe state.
 */
export const resetReportedQueryErrors = (): void => {
  reportedErrors.clear()
}
