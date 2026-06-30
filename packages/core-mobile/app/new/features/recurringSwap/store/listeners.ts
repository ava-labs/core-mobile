import { queryClient } from 'contexts/ReactQueryProvider'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import { TransferSignatureReason } from '@avalabs/fusion-sdk'
import type { QueryCacheNotifyEvent } from '@tanstack/react-query'
import { onAppUnlocked } from 'store/app/slice'
import type { AppStartListening } from 'store/types'
import { commonStorage, CommonStorageKeys } from 'utils/mmkv'
import { registerAndGetDeviceArn } from 'services/notifications/registerDeviceToNotificationSender'
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
  loadSubscribedOrders,
  saveSubscribedOrders
} from '../utils/subscribedOrders'
import { subscribeForRecurringSwap } from 'services/notifications/recurringSwap/subscribeForRecurringSwap'
import {
  pendingActionStore,
  type PendingActionEntry
} from './pendingActionStore'

// In-flight subscribe dedupe. Keyed by `${ownerLower}:${chainId}:${orderId}`
// so concurrent refetches (banner + manage-screen mount + 30s poll + focus +
// unlock invalidate) don't all fire the same subscribe call. Module-scoped
// because the React Query cache subscriber is a singleton — multiple
// concurrent firings of `handleQueryCacheEvent` share this set.
//
// The backend treats re-subscribes as idempotent reactivations (Sarp's PR #172),
// so a duplicate that slips through is harmless — this set is purely a
// network-traffic optimization.
const subscribeInFlight = new Set<string>()

// The SDK now signs and broadcasts internally for fill /
// cancel / pause / resume, so the old Redux listeners that watched for
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
//      requested transition (cancel/pause/resume), the order vanishes,
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

// ─── Notification subscription ────────────────────────────────────────────────

// Active and Paused are the only statuses that can fire future fills (Paused
// can be resumed). Cancelled / Completed are terminal — the backend webhook
// deactivates the subscription on those transitions anyway (per Sarp's PR
// #172), so subscribing them client-side would be a wasted round-trip.
function isSubscribableStatus(status: RecurringOrderStatus): boolean {
  return (
    status === RecurringOrderStatus.Active ||
    status === RecurringOrderStatus.Paused
  )
}

/**
 * Subscribe this device to push notifications for any new orders that
 * appeared in the latest listOrders snapshot and aren't already tracked
 * locally. Fire-and-forget — sequential per-order with a per-success save
 * so a mid-batch app kill leaves a coherent persisted set instead of
 * orphaning the surviving subscriptions.
 *
 * Failure handling: log + skip. The next listOrders refetch (banner mount,
 * 30s poll, unlock invalidate, etc.) retries any unsubscribed order — and
 * the backend treats re-subscribes as idempotent reactivations, so the
 * worst case is a one-refetch delay before push notifications start.
 */
async function ensureOrderSubscriptions(
  ownerAddress: string,
  chainId: number,
  schedules: readonly RecurringOrder[]
): Promise<void> {
  const ownerLower = ownerAddress.toLowerCase()
  const subscribed = loadSubscribedOrders(ownerAddress, chainId)

  // Orders from this snapshot that still need a subscription. Filtering up
  // front lets us resolve the deviceArn exactly once for the whole batch —
  // and skip the register call entirely in the steady state (every order
  // already subscribed, the common case on the 30s poll).
  const pending = schedules.filter(
    schedule =>
      isSubscribableStatus(schedule.status) &&
      !subscribed.has(schedule.orderId) &&
      !subscribeInFlight.has(`${ownerLower}:${chainId}:${schedule.orderId}`)
  )
  if (pending.length === 0) return

  // Resolve the deviceArn for this batch. `registerDeviceToNotificationSender`
  // persists the ARN in commonStorage, and the global notification flow keeps
  // that key fresh — re-registered on FCM token rotation (`onFcmTokenChange`
  // drives the balance-change / news / price-alert subscribes), wiped by
  // logout's `clearAll()`. So reading the persisted key gives the same
  // freshness as a session-scoped memo with none of the invalidation
  // machinery, and it survives cold start. Fall back to /v1/push/register only
  // when the key is empty. Bail on failure rather than retrying register once
  // per order; the next listOrders refetch retries the whole batch.
  let deviceArn = commonStorage.getString(
    CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION
  )
  if (!deviceArn) {
    try {
      deviceArn = await registerAndGetDeviceArn()
    } catch (err) {
      Logger.error('[RecurringSwap] deviceArn registration failed', err)
      return
    }
  }

  for (const schedule of pending) {
    const orderId = schedule.orderId
    const inFlightKey = `${ownerLower}:${chainId}:${orderId}`
    // Re-check in-flight: a concurrent ensureOrderSubscriptions run may have
    // claimed this order while we awaited the deviceArn above.
    if (subscribeInFlight.has(inFlightKey)) continue
    subscribeInFlight.add(inFlightKey)
    try {
      await subscribeForRecurringSwap({ orderId, deviceArn })
      subscribed.add(orderId)
      // Save after each success so a mid-batch interruption (app kill,
      // network drop on the next iteration) preserves the work done so far.
      // Merge with the latest persisted set to avoid clobbering concurrent
      // ensureOrderSubscriptions runs for the same (owner, chain).
      const merged = new Set([
        ...loadSubscribedOrders(ownerAddress, chainId),
        ...subscribed
      ])
      saveSubscribedOrders(ownerAddress, chainId, merged)
    } catch (err) {
      Logger.error('[RecurringSwap] order subscribe failed', {
        orderId,
        err
      })
      // The ARN may have been retired backend-side (e.g. dead-endpoint
      // cleanup). Re-reading the persisted key would just hand back the same
      // dead ARN, so force a fresh /v1/push/register and reuse the live ARN
      // for the remaining orders in this loop. Bail if the re-register itself
      // fails — the next listOrders refetch retries the whole batch.
      try {
        deviceArn = await registerAndGetDeviceArn()
      } catch (registerErr) {
        Logger.error(
          '[RecurringSwap] deviceArn re-registration failed',
          registerErr
        )
        return
      }
    } finally {
      subscribeInFlight.delete(inFlightKey)
    }
  }
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
 *   - `resume`  → done when the order has reached `Active`.
 *
 * Using the precise destination matters for the cancel-from-Paused flow:
 * a "status no longer Active" check would clear the spinner the moment
 * the next listOrders refetch lands (the order was already Paused before
 * the cancel TX was even broadcast), causing a UI flicker back to
 * Pause/Resume until the Cancelled status finally indexes.
 */
function isPendingActionResolved(
  entry: PendingActionEntry,
  order: RecurringOrder
): boolean {
  switch (entry.type) {
    case TransferSignatureReason.CancelRecurringSwap:
      return order.status === RecurringOrderStatus.Cancelled
    case TransferSignatureReason.PauseRecurringSwap:
      return order.status === RecurringOrderStatus.Paused
    case TransferSignatureReason.ResumeRecurringSwap:
      return order.status === RecurringOrderStatus.Active
    default: {
      // Exhaustiveness guard: a new RecurringOrderActionType must add its
      // resolved-state case above. Without this, an unhandled type would
      // silently return undefined (falsy) and the spinner would hang until
      // the TTL backstop evicts it. Assigning to `never` makes that a
      // compile error; the throw is the runtime backstop.
      const unreachable: never = entry.type
      throw new Error(
        `isPendingActionResolved: unhandled action type ${String(unreachable)}`
      )
    }
  }
}

/**
 * Clears pending-action entries (cancel / pause / resume) for any order
 * whose server status has caught up, and evicts entries whose TTL has
 * elapsed — protects against a dropped/replaced action TX leaving the row
 * stuck on its "-ing" spinner forever.
 *
 * Scoped to the event's `(eventOwner, eventChainId)`: the cache subscriber
 * fires once per RECURRING_SCHEDULES query and each query lists exactly one
 * account/chain. The "order vanished from the list" clear is only meaningful
 * for entries belonging to THAT account/chain — an entry for a *different*
 * account is simply absent from this list, not gone. Reconciling it here
 * (as the unscoped version did) wrongly cleared a sibling account's in-flight
 * spinner, re-enabling its buttons mid-flight and inviting a redundant second
 * on-chain action. `gcTime: Infinity` keeps every account's query resident,
 * so the clobber recurred on any later refetch from either side.
 *
 * The TTL eviction stays account/chain-agnostic: it's a pure time-based
 * safety net for stuck spinners, harmless to apply on any refetch.
 */
function reconcilePendingActions(
  schedules: readonly RecurringOrder[],
  eventOwner: string,
  eventChainId: number
): void {
  const { pending, clearPending, isExpired } = pendingActionStore.getState()
  const orderIds = Object.keys(pending)
  if (orderIds.length === 0) return

  const ownerKey = eventOwner.toLowerCase()
  const byId = new Map<string, RecurringOrder>(
    schedules.map(s => [s.orderId, s])
  )
  for (const orderId of orderIds) {
    if (isExpired(orderId)) {
      clearPending(orderId)
      continue
    }
    const entry = pending[orderId]
    if (!entry) continue
    // Out of scope for this event — another account/chain owns this entry,
    // so its absence from THIS list says nothing. Leave it untouched; its
    // own query's refetch (or the TTL) will reconcile it. Address compare is
    // case-insensitive so an EIP-55 checksum vs lowercase mismatch between
    // the query key and the stored entry can't strand the spinner.
    if (
      entry.ownerAddress.toLowerCase() !== ownerKey ||
      entry.chainId !== eventChainId
    ) {
      continue
    }
    const match = byId.get(orderId)
    if (!match) {
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
    // to enforce the TTL eviction. Covers cancel / pause / resume uniformly.
    // Scoped to this event's (account, chain) so a sibling account's refetch
    // can't clear another account's in-flight entry.
    reconcilePendingActions(schedules ?? [], ownerAddress, chainId)

    // Seed/process even on empty responses so the (account, chain) snapshot
    // is initialised once — subsequent refetches then hit the new-failure
    // path normally.
    processAllSchedules(ownerAddress, chainId, schedules ?? [])

    // Fire-and-forget the per-order push subscription pass. Kept out of the
    // synchronous cache-subscriber call path; failures inside the function are
    // logged but never bubble up — the next refetch retries any order that
    // didn't make it into the persisted subscribed-set.
    void ensureOrderSubscriptions(ownerAddress, chainId, schedules ?? []).catch(
      err => {
        Logger.error('[RecurringSwap] ensureOrderSubscriptions threw', err)
      }
    )
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

/**
 * Register all recurring-swap listeners — the Redux `onAppUnlocked` schedules
 * invalidator and the React Query cache subscriber (failure watcher +
 * pending-action reconciler).
 *
 * Mirrors `addFusionListeners`'s shape so all swap-related listener wiring
 * lives in `store/listeners.ts` files registered uniformly by
 * `store/middleware/listener.ts`, rather than half via Redux and half via a
 * React hook mounted in `ReactQueryProvider`.
 *
 * The step-discriminated `eth_sendTransaction` listeners that previously
 * lived here were removed when the SDK started signing + broadcasting
 * internally — those post-broadcast analytics and cache invalidations now
 * fire inline from the hooks themselves.
 */
export function addRecurringSwapListeners(
  startListening: AppStartListening
): void {
  // `refetchOnWindowFocus: true` on `useRecurringSchedules` already covers
  // AppState foregrounding, but NOT the WalletState LOCKED → ACTIVE
  // transition (cold start, post-lock-timeout, re-auth), which can land
  // while AppState === 'active' before the user is on a schedules-observing
  // screen. Marking the query stale on unlock means the next mount of the
  // banner / manage screen refetches against Markr.
  startListening({
    actionCreator: onAppUnlocked,
    effect: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_SCHEDULES_QK })
    }
  })

  startRecurringFailureWatcher()
}
