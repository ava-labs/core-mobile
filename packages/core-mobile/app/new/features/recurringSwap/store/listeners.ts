import { queryClient } from 'contexts/ReactQueryProvider'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import type { QueryCacheNotifyEvent } from '@tanstack/react-query'
import { RECURRING_SCHEDULES_QK } from '../hooks/useRecurringSchedules'
import { RecurringOrderStatus } from '../types'
import type { RecurringOrder } from '../types'
import {
  isSeenFailuresInitialised,
  loadSeenFailures,
  saveSeenFailures,
  makeFailureKey
} from '../utils/seenFailures'
import {
  pendingActionStore,
  type PendingActionEntry
} from './pendingActionStore'

// The SDK now signs and broadcasts internally for fill /
// cancel / pause / unpause, so the old Redux listeners that watched for
// `onInAppRequestSucceeded` on step-discriminated `eth_sendTransaction`
// requests are gone — the hooks themselves resolve when broadcast lands
// and fire their own analytics + invalidations inline.
//
// What remains in this file:
//   1. The React Query cache subscriber that watches the
//      RECURRING_SCHEDULES query for new on-chain failures (surfacing
//      "Recurring swap execution failed" snackbar once per failure).
//   2. The pending-action reconciler that clears entries from
//      `pendingActionStore` once the server status reflects the
//      requested transition (cancel/pause/unpause), the order vanishes,
//      or the TTL elapses.

// ─── Failure watcher ──────────────────────────────────────────────────────────

/**
 * Process one schedule snapshot. Mutates `seenFailures` in-place and returns
 * a `failuresDirty` flag so the caller can decide whether to persist.
 *
 * The silent HTTP auto-cancel on repeated failures was removed when the
 * SDK's cancel endpoint switched to on-chain calldata — a silent listener
 * can no longer sign + broadcast a TX without the user. The
 * listener still surfaces the failure snackbar in-app; completed/failed
 * analytics live in the notification sender service, not on mobile, because
 * the client only observes them when the app happens to be foregrounded.
 */
function processSchedule(
  schedule: RecurringOrder,
  seenFailures: Set<string>
): { failuresDirty: boolean; newFailures: boolean } {
  let failuresDirty = false
  let newFailures = false

  for (const failure of schedule.failures) {
    const key = makeFailureKey(schedule.orderId, failure.executionIndex)
    if (seenFailures.has(key)) continue

    seenFailures.add(key)
    failuresDirty = true
    newFailures = true
  }

  return { failuresDirty, newFailures }
}

/**
 * Iterates all schedules, processes failures/completions, and persists dirty
 * state. `ownerAddress` + `chainId` scope the seen-failures persisted set per
 * account/chain so dedupe state can't leak across either dimension.
 *
 * First-observation behaviour: when no snapshot exists yet for this
 * (account, chain), seed the set with every failure currently surfaced by
 * the server *without* firing snackbars. Users with pre-existing failures
 * (fresh install, reinstall, wallet swap clearing MMKV) would otherwise see
 * one snackbar per historical failure on the first refetch.
 */
function processAllSchedules(
  ownerAddress: string,
  chainId: number,
  schedules: readonly RecurringOrder[]
): void {
  const isInitialised = isSeenFailuresInitialised(ownerAddress, chainId)
  const seenFailures = loadSeenFailures(ownerAddress, chainId)

  if (!isInitialised) {
    // Seed silently. `saveSeenFailures` flips `initialised: true`, so the
    // next refetch reaches the normal new-failure path.
    for (const schedule of schedules) {
      for (const failure of schedule.failures) {
        seenFailures.add(
          makeFailureKey(schedule.orderId, failure.executionIndex)
        )
      }
    }
    saveSeenFailures(ownerAddress, chainId, seenFailures)
    return
  }

  let failuresDirty = false
  let anyNewFailure = false
  for (const schedule of schedules) {
    const result = processSchedule(schedule, seenFailures)
    if (result.failuresDirty) failuresDirty = true
    if (result.newFailures) anyNewFailure = true
  }

  if (failuresDirty) saveSeenFailures(ownerAddress, chainId, seenFailures)
  if (anyNewFailure) showSnackbar('Recurring swap execution failed')
}

/**
 * Per-action-type predicate that returns `true` when the pending entry has
 * reached its destination state — i.e. Markr's `status` now matches the
 * exact state the on-chain action was meant to produce. The reconciler
 * clears the entry when this returns `true` (or when the order vanishes /
 * TTL elapses).
 *
 *   - `cancel`  → done when the order has reached `Cancelled`.
 *   - `pause`   → done when the order has reached `Paused`.
 *   - `unpause` → done when the order has reached `Active`.
 *
 * Using the precise destination matters for the cancel-from-Paused flow:
 * a "status no longer Active" check would clear the spinner the moment
 * the next listOrders refetch lands (the order was already Paused before
 * the cancel TX was even broadcast), causing a UI flicker back to
 * Pause/Unpause until the Cancelled status finally indexes.
 */
function isPendingActionResolved(
  entry: PendingActionEntry,
  order: RecurringOrder
): boolean {
  switch (entry.type) {
    case 'cancel':
      return order.status === RecurringOrderStatus.Cancelled
    case 'pause':
      return order.status === RecurringOrderStatus.Paused
    case 'unpause':
      return order.status === RecurringOrderStatus.Active
  }
}

/**
 * Clears pending-action entries (cancel / pause / unpause) for any order
 * whose server status has caught up, and evicts entries whose TTL has
 * elapsed — protects against a dropped/replaced action TX leaving the row
 * stuck on its "-ing" spinner forever.
 */
function reconcilePendingActions(schedules: readonly RecurringOrder[]): void {
  const { pending, clearPending, isExpired } = pendingActionStore.getState()
  const orderIds = Object.keys(pending)
  if (orderIds.length === 0) return

  const byId = new Map<string, RecurringOrder>(
    schedules.map(s => [s.orderId, s])
  )
  for (const orderId of orderIds) {
    if (isExpired(orderId)) {
      clearPending(orderId)
      continue
    }
    const match = byId.get(orderId)
    const entry = pending[orderId]
    if (!match || !entry) {
      clearPending(orderId)
      continue
    }
    if (isPendingActionResolved(entry, match)) {
      clearPending(orderId)
    }
  }
}

/**
 * Handles a single React Query cache event for the RECURRING_SCHEDULES query.
 *
 * The full queryKey shape is `[RECURRING_SCHEDULES, ownerAddress, chainId]`
 * (see `useRecurringSchedules`). We pluck both out so the seen-failures
 * persistence can be scoped per (account, chain).
 */
function handleQueryCacheEvent(event: QueryCacheNotifyEvent): void {
  if (
    event.query.queryKey?.[0] !== RECURRING_SCHEDULES_QK[0] ||
    event.type !== 'updated' ||
    event.query.state.status !== 'success'
  ) {
    return
  }

  const ownerAddress = event.query.queryKey[1]
  const chainId = event.query.queryKey[2]
  if (
    typeof ownerAddress !== 'string' ||
    ownerAddress.length === 0 ||
    typeof chainId !== 'number'
  ) {
    // Defensive: the enabled gate in `useRecurringSchedules` already prevents
    // this, but a malformed manual cache update could violate the assumption.
    return
  }

  const schedules = event.query.state.data as
    | readonly RecurringOrder[]
    | undefined

  try {
    // Always reconcile pending-action entries — even on empty responses we
    // need to drop entries for orders that have vanished from the list and
    // to enforce the TTL eviction. Covers cancel / pause / unpause uniformly.
    reconcilePendingActions(schedules ?? [])

    // Seed/process even on empty responses so the (account, chain) snapshot
    // is initialised once — subsequent refetches then hit the new-failure
    // path normally.
    processAllSchedules(ownerAddress, chainId, schedules ?? [])
  } catch (err) {
    Logger.error('[RecurringSwap] Failure watcher error', err)
  }
}

/**
 * Subscribe to the React Query cache and watch all RECURRING_SCHEDULES queries
 * for new failures and for pending-action reconciliation.
 *
 * Call once at app startup. The returned unsubscribe function exists so tests
 * (and any future hot-reload teardown) can drop the listener — production
 * doesn't currently invoke it.
 */
export function startRecurringFailureWatcher(): () => void {
  return queryClient.getQueryCache().subscribe(handleQueryCacheEvent)
}

// `addRecurringSwapListeners` (the old Redux listener registration that
// watched for step-discriminated `eth_sendTransaction` requests) is
// intentionally NOT re-exported. The SDK now signs and broadcasts
// internally, so the post-broadcast analytics + cache
// invalidation effects live in the hooks themselves.
