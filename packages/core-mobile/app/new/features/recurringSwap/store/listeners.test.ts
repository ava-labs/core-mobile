/**
 * Tests for startRecurringFailureWatcher() — the React Query cache subscriber
 * that detects new schedule failures and surfaces the in-app snackbar. The
 * silent HTTP auto-cancel was removed when cancel switched to on-chain calldata;
 * completed/failed analytics moved to the notification sender service because
 * the client only sees them when the app is foregrounded.
 */

// ─── MMKV mock (must be before imports) ───────────────────────────────────────

const mockMmkvStore: Record<string, string | boolean> = {}
jest.mock('utils/mmkv/storages', () => ({
  commonStorage: {
    getString: (k: string) => {
      const v = mockMmkvStore[k]
      return typeof v === 'string' ? v : undefined
    },
    getBoolean: (k: string) => {
      const v = mockMmkvStore[k]
      return typeof v === 'boolean' ? v : undefined
    },
    set: (k: string, v: string | boolean) => {
      mockMmkvStore[k] = v
    }
  }
}))

// ─── Analytics mock ───────────────────────────────────────────────────────────

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

// ─── Toast mock ───────────────────────────────────────────────────────────────

jest.mock('common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

// ─── Logger mock ──────────────────────────────────────────────────────────────

jest.mock('utils/Logger', () => ({
  warn: jest.fn(),
  error: jest.fn()
}))

// ─── pendingActionStore mock ─────────────────────────────────────────────────
// Bypass MMKV by hand-rolling a minimal store fake that the listener can call
// `getState()` on. We control `pending` and assert on `clearPending` calls.
//
// The store now persists `{ type, addedAt }` per orderId (action type drives
// which destination status counts as "resolved"); the fake mirrors that shape
// so the reconciler's `entry.type` switch sees real values.

type PendingEntry = {
  type:
    | TransferSignatureReason.CancelRecurringSwap
    | TransferSignatureReason.PauseRecurringSwap
    | TransferSignatureReason.ResumeRecurringSwap
  addedAt: number
  // (account, chain) the action was issued under — the reconciler only
  // touches entries matching the event's scope so a sibling account's
  // listOrders success can't clear another account's in-flight entry.
  ownerAddress: string
  chainId: number
}

type PendingStoreFake = {
  pending: Record<string, PendingEntry>
  markPending: jest.Mock
  clearPending: jest.Mock
  isExpired: jest.Mock<boolean, [string, number?]>
}

let mockPendingStoreState: PendingStoreFake = {
  pending: {},
  markPending: jest.fn(),
  clearPending: jest.fn(),
  isExpired: jest.fn<boolean, [string, number?]>(() => false)
}

jest.mock('./pendingActionStore', () => ({
  pendingActionStore: {
    getState: () => mockPendingStoreState
  }
}))

// ─── QueryClient mock ─────────────────────────────────────────────────────────

type CacheSubscriber = (event: Record<string, unknown>) => void
let mockCacheSubscribers: CacheSubscriber[] = []

const mockInvalidate = jest.fn()

jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidate(...args),
    getQueryCache: () => ({
      subscribe: (cb: CacheSubscriber) => {
        mockCacheSubscribers.push(cb)
        return () => {
          mockCacheSubscribers = mockCacheSubscribers.filter(s => s !== cb)
        }
      }
    })
  }
}))

// ─── posthog selector mock ────────────────────────────────────────────────────
// The SWAP_RECURRING kill-switch drives whether the failure watcher wires up
// the push-notification subscription pass. `listeners.ts` only consumes
// `selectIsRecurringSwapsBlocked` from this barrel, so a minimal stub avoids
// pulling the real module's heavy import graph (WalletFactory, etc.) into the
// test.

let mockIsRecurringSwapsBlocked = false
jest.mock('store/posthog', () => ({
  selectIsRecurringSwapsBlocked: () => mockIsRecurringSwapsBlocked
}))

// ─── notification-subscription mocks ──────────────────────────────────────────
// The per-order push-subscribe pass (`ensureOrderSubscriptions`) resolves the
// deviceArn then POSTs one subscribe per subscribable order. Stub both network
// boundaries so the gating tests can assert whether the pass ran without
// touching the real notification-sender clients.

const mockRegisterAndGetDeviceArn = jest.fn<Promise<string>, []>(() =>
  Promise.resolve('arn:test-device')
)
jest.mock('services/notifications/registerDeviceToNotificationSender', () => ({
  registerAndGetDeviceArn: () => mockRegisterAndGetDeviceArn()
}))

const mockSubscribeForRecurringSwap = jest.fn<Promise<void>, [unknown]>(() =>
  Promise.resolve()
)
jest.mock(
  'services/notifications/recurringSwap/subscribeForRecurringSwap',
  () => ({
    subscribeForRecurringSwap: (arg: unknown) =>
      mockSubscribeForRecurringSwap(arg)
  })
)

// ─── Subject under test ───────────────────────────────────────────────────────

import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from 'common/utils/toast'
import { TransferSignatureReason } from '@avalabs/fusion-sdk'
import { onAppUnlocked, onRehydrationComplete } from 'store/app/slice'
import { RECURRING_SCHEDULES_QK } from '../hooks/useRecurringSchedules'
import { RecurringOrderStatus, type RecurringOrder } from '../types'
import {
  addRecurringSwapListeners,
  startRecurringFailureWatcher
} from './listeners'

const captureSpy = AnalyticsService.capture as jest.Mock
const showSnackbarSpy = showSnackbar as jest.Mock

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SCHEDULES_QK_ROOT = 'recurringSchedules'

const BASE_SCHEDULE: RecurringOrder = {
  orderId: '0xorder1',
  owner: '0xowner1',
  chainId: 43114,
  tokenIn: '0xtokenIn',
  tokenOut: '0xtokenOut',
  amount: 1_000_000n,
  numberOfOrders: 4,
  executedOrders: 1,
  remainingOrders: 3,
  frequency: { unit: 'week', value: 1 },
  totalAmountIn: 4_000_000n,
  tryCount: 0,
  failures: [],
  status: RecurringOrderStatus.Active,
  createdAt: 1_700_000_000,
  nextExecutionAt: 1_700_000_000 + 604_800
} as unknown as RecurringOrder

/** Simulate a React Query "updated" event for the schedules query. */
function fireQueryUpdate(schedules: RecurringOrder[]): void {
  for (const cb of mockCacheSubscribers) {
    cb({
      type: 'updated',
      query: {
        queryKey: [SCHEDULES_QK_ROOT, '0xowner1', 43114],
        state: {
          status: 'success',
          data: schedules
        }
      }
    })
  }
}

const flush = (): Promise<void> => new Promise(r => setImmediate(r))

/**
 * The first listOrders response on a (account, chain) seeds the seen-failures
 * snapshot without surfacing snackbars (prevents a "n historical failures →
 * n snackbars" storm on fresh installs / reinstalls / wallet swaps). Tests
 * that want to exercise the new-failure path need an initial seeding update.
 */
function seedInitialObservation(): void {
  fireQueryUpdate([])
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('startRecurringFailureWatcher', () => {
  beforeEach(() => {
    Object.keys(mockMmkvStore).forEach(k => delete mockMmkvStore[k])
    mockCacheSubscribers = []
    mockInvalidate.mockReset()
    captureSpy.mockReset()
    showSnackbarSpy.mockReset()
    mockPendingStoreState = {
      pending: {},
      markPending: jest.fn(),
      clearPending: jest.fn(),
      isExpired: jest.fn<boolean, [string, number?]>(() => false)
    }
    mockIsRecurringSwapsBlocked = false
    mockRegisterAndGetDeviceArn.mockClear()
    mockSubscribeForRecurringSwap.mockClear()
    // Live reader — evaluated on every cache event — mirrors production
    // (`selectIsRecurringSwapsBlocked(listenerApi.getState())`). Flipping
    // `mockIsRecurringSwapsBlocked` between updates exercises the live re-read.
    startRecurringFailureWatcher(() => mockIsRecurringSwapsBlocked)
  })

  // ── 1. New failure detection + de-dup ──────────────────────────────────────

  it('shows the failure snackbar once for a new failure', async () => {
    seedInitialObservation()
    await flush()

    const schedule: RecurringOrder = {
      ...BASE_SCHEDULE,
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1_700_001_000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(showSnackbarSpy).toHaveBeenCalledWith(
      'Recurring swap execution failed'
    )
    expect(showSnackbarSpy).toHaveBeenCalledTimes(1)
    expect(captureSpy).not.toHaveBeenCalled()
  })

  // Regression: previously, N new failures in a single refetch fired N
  // identical snackbars. The watcher now coalesces to one toast per refetch.
  it('shows the failure snackbar only once even when multiple new failures arrive in a single refetch', async () => {
    seedInitialObservation()
    await flush()

    const scheduleA: RecurringOrder = {
      ...BASE_SCHEDULE,
      orderId: '0xorderA',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1_700_001_000
        },
        {
          executionIndex: 2,
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1_700_002_000
        }
      ]
    }
    const scheduleB: RecurringOrder = {
      ...BASE_SCHEDULE,
      orderId: '0xorderB',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1_700_003_000
        }
      ]
    }

    fireQueryUpdate([scheduleA, scheduleB])
    await flush()

    expect(showSnackbarSpy).toHaveBeenCalledWith(
      'Recurring swap execution failed'
    )
    expect(showSnackbarSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT show the snackbar again for the same failure on a second update', async () => {
    seedInitialObservation()
    await flush()

    const schedule: RecurringOrder = {
      ...BASE_SCHEDULE,
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1_700_001_000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()
    showSnackbarSpy.mockClear()

    fireQueryUpdate([schedule])
    await flush()

    expect(showSnackbarSpy).not.toHaveBeenCalled()
  })

  // Regression: previously, every pre-existing failure on a fresh install
  // (no MMKV history) surfaced its own snackbar — 10 schedules with 3
  // failures each = 30 snackbars. First observation now seeds silently.
  it('does NOT surface snackbars for failures present on the first observation', async () => {
    const schedule: RecurringOrder = {
      ...BASE_SCHEDULE,
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1_700_001_000
        },
        {
          executionIndex: 2,
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1_700_002_000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(showSnackbarSpy).not.toHaveBeenCalled()

    // A subsequent refetch with the SAME failures stays silent (dedupe).
    fireQueryUpdate([schedule])
    await flush()
    expect(showSnackbarSpy).not.toHaveBeenCalled()

    // A genuinely new failure (executionIndex: 3) on the third refetch
    // surfaces a snackbar — proves seeding flipped initialised=true.
    const withNewFailure: RecurringOrder = {
      ...schedule,
      failures: [
        ...schedule.failures,
        {
          executionIndex: 3,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1_700_003_000
        }
      ]
    }
    fireQueryUpdate([withNewFailure])
    await flush()
    expect(showSnackbarSpy).toHaveBeenCalledTimes(1)
  })

  // ── 2. Silent auto-cancel removed ─────────────────────────────────────────
  // The listener no longer dispatches any cancel — cancel is on-chain and
  // requires user signing. Failure detection still surfaces the in-app
  // snackbar; surfacing a "please cancel" affordance is mobile-side
  // follow-up work.

  it('does NOT invoke any cancel side-effect on a "Slippage tolerance exceeded" failure', async () => {
    seedInitialObservation()
    await flush()

    const schedule: RecurringOrder = {
      ...BASE_SCHEDULE,
      status: RecurringOrderStatus.Active,
      failures: [
        {
          executionIndex: 2,
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1_700_002_000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(showSnackbarSpy).toHaveBeenCalledWith(
      'Recurring swap execution failed'
    )
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  // ── 3. Completed schedules ────────────────────────────────────────────────
  // Completed/failed analytics are no longer fired client-side — the
  // notification sender service owns those events. The watcher must be a
  // no-op for a `completed` schedule with no new failures.

  it('does NOT fire any analytics or snackbar when a schedule is completed', async () => {
    const schedule: RecurringOrder = {
      ...BASE_SCHEDULE,
      status: RecurringOrderStatus.Completed,
      executedOrders: 4,
      remainingOrders: 0,
      nextExecutionAt: null,
      failures: []
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(captureSpy).not.toHaveBeenCalled()
    expect(showSnackbarSpy).not.toHaveBeenCalled()
  })

  // ── 4. Non-matching query key is ignored ──────────────────────────────────

  it('ignores cache updates for other query keys', async () => {
    for (const cb of mockCacheSubscribers) {
      cb({
        type: 'updated',
        query: {
          queryKey: ['someOtherKey', '0xowner'],
          state: { status: 'success', data: [BASE_SCHEDULE] }
        }
      })
    }
    await flush()

    expect(captureSpy).not.toHaveBeenCalled()
  })

  // ── 5. Non-success status is ignored ─────────────────────────────────────

  it('ignores cache updates with status !== success', async () => {
    for (const cb of mockCacheSubscribers) {
      cb({
        type: 'updated',
        query: {
          queryKey: [SCHEDULES_QK_ROOT, '0xowner1', 43114],
          state: { status: 'loading', data: undefined }
        }
      })
    }
    await flush()

    expect(captureSpy).not.toHaveBeenCalled()
  })

  // ── 6. Pending-action reconciliation ─────────────────────────────────────
  // Cancel / pause / resume each have their own "resolved" destination
  // status. The reconciler picks the right one off `entry.type` — the tests
  // below cover each branch plus the safety nets (order vanished, TTL).

  const pendingEntry = (
    type: PendingEntry['type'],
    ownerAddress = '0xowner1',
    chainId = 43114
  ): PendingEntry => ({
    type,
    addedAt: Date.now(),
    ownerAddress,
    chainId
  })

  it('clears pending-cancel entry once the order status flips to cancelled', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.CancelRecurringSwap)
    }

    fireQueryUpdate([
      { ...BASE_SCHEDULE, status: RecurringOrderStatus.Cancelled }
    ])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('keeps pending-cancel entry while the order is still reported as active', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.CancelRecurringSwap)
    }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  // Regression: a `status !== Active` check would clear the spinner the
  // moment the next refetch lands (the order was already Paused before
  // the cancel TX was even broadcast), flickering the row back to
  // Pause/Resume buttons until the actual Cancelled status indexes.
  it('keeps pending-cancel entry while the order is still reported as paused (cancel-from-Paused)', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.CancelRecurringSwap)
    }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Paused }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  it('clears pending-pause entry once the order status flips to paused', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.PauseRecurringSwap)
    }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Paused }])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('keeps pending-pause entry while the order is still reported as active', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.PauseRecurringSwap)
    }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  it('clears pending-resume entry once the order status flips back to active', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.ResumeRecurringSwap)
    }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('keeps pending-resume entry while the order is still reported as paused', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.ResumeRecurringSwap)
    }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Paused }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  it('clears pending-action entry when the order vanishes from the response', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.CancelRecurringSwap)
    }

    fireQueryUpdate([])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('clears pending-action entry once the TTL has elapsed even if the order is still in its starting state', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(TransferSignatureReason.PauseRecurringSwap)
    }
    mockPendingStoreState.isExpired = jest.fn((id: string) => id === '0xorder1')

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  // Regression (cross-account clobber): account A has an in-flight cancel on
  // `0xorder1`. A listOrders success for account B (different owner, same
  // chain) must NOT clear A's entry just because A's order isn't in B's list
  // — the reconciler only acts on entries scoped to the event's
  // (account, chain). Amplified in production by gcTime: Infinity keeping
  // every account's query resident, so any later refetch re-triggered it.
  it('does NOT clear a pending entry belonging to a different account when another account refetches', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(
        TransferSignatureReason.CancelRecurringSwap,
        '0xownerA',
        43114
      )
    }

    // Event for account B (queryKey owner '0xowner1') with an empty list.
    fireQueryUpdate([])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  // Same account/chain, address casing differs (EIP-55 checksum vs lowercase):
  // the scope match must be case-insensitive or the entry would never resolve.
  it('clears a pending entry whose owner matches the event case-insensitively', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(
        TransferSignatureReason.CancelRecurringSwap,
        '0xOWNER1',
        43114
      )
    }

    fireQueryUpdate([
      { ...BASE_SCHEDULE, status: RecurringOrderStatus.Cancelled }
    ])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  // A different chain on the same account must also be out of scope.
  it('does NOT clear a pending entry from a different chain when the event is for another chain', async () => {
    mockPendingStoreState.pending = {
      '0xorder1': pendingEntry(
        TransferSignatureReason.CancelRecurringSwap,
        '0xowner1',
        1
      )
    }

    fireQueryUpdate([])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  // ── Kill-switch gating of the push-subscription pass ───────────────────────
  // The SWAP_RECURRING kill-switch gates ONLY the per-order push-subscribe
  // pass; the failure snackbar and pending-action reconciliation run
  // regardless. The gate is read live per cache event (not snapshotted), so a
  // mid-session flip takes effect on the next refetch.

  it('subscribes subscribable orders when the kill-switch is off', async () => {
    mockIsRecurringSwapsBlocked = false

    fireQueryUpdate([BASE_SCHEDULE])
    await flush()
    await flush()

    expect(mockSubscribeForRecurringSwap).toHaveBeenCalledTimes(1)
    expect(mockSubscribeForRecurringSwap).toHaveBeenCalledWith({
      orderId: BASE_SCHEDULE.orderId,
      deviceArn: 'arn:test-device'
    })
  })

  it('does NOT subscribe (or resolve a deviceArn) when the kill-switch is on', async () => {
    mockIsRecurringSwapsBlocked = true

    fireQueryUpdate([BASE_SCHEDULE])
    await flush()
    await flush()

    expect(mockRegisterAndGetDeviceArn).not.toHaveBeenCalled()
    expect(mockSubscribeForRecurringSwap).not.toHaveBeenCalled()
  })

  it('still surfaces the failure snackbar when the kill-switch is on', async () => {
    mockIsRecurringSwapsBlocked = true
    seedInitialObservation()
    await flush()

    fireQueryUpdate([
      {
        ...BASE_SCHEDULE,
        failures: [
          {
            executionIndex: 1,
            reasons: ['Quote expired before execution'],
            tryCount: 3,
            failedAt: 1_700_001_000
          }
        ]
      } as RecurringOrder
    ])
    await flush()

    expect(showSnackbarSpy).toHaveBeenCalledWith(
      'Recurring swap execution failed'
    )
    // Snackbar fired, but the gated push-subscribe pass did not.
    expect(mockSubscribeForRecurringSwap).not.toHaveBeenCalled()
  })

  it('re-reads the kill-switch live: a mid-session flip on gates the next refetch', async () => {
    // First refetch while unblocked → subscribes.
    mockIsRecurringSwapsBlocked = false
    fireQueryUpdate([BASE_SCHEDULE])
    await flush()
    await flush()
    expect(mockSubscribeForRecurringSwap).toHaveBeenCalledTimes(1)

    // Flag flips on mid-session. A snapshot captured at wire time would keep
    // subscribing; the live reader must gate the next refetch. Use a fresh
    // order id so the subscribed-set dedupe isn't what suppresses the call.
    mockSubscribeForRecurringSwap.mockClear()
    mockIsRecurringSwapsBlocked = true
    fireQueryUpdate([
      { ...BASE_SCHEDULE, orderId: '0xorder2' } as RecurringOrder
    ])
    await flush()
    await flush()

    expect(mockSubscribeForRecurringSwap).not.toHaveBeenCalled()
  })
})

// ─── addRecurringSwapListeners ────────────────────────────────────────────────
// The static listener-registration entrypoint mirrors `addFusionListeners`:
// it wires the `onAppUnlocked` schedules invalidator into the redux
// listener middleware *and* kicks off the React Query cache subscriber
// (failure watcher + pending-action reconciler) registered above.

describe('addRecurringSwapListeners', () => {
  beforeEach(() => {
    mockCacheSubscribers = []
    mockInvalidate.mockReset()
    mockIsRecurringSwapsBlocked = false
    mockRegisterAndGetDeviceArn.mockClear()
    mockSubscribeForRecurringSwap.mockClear()
    Object.keys(mockMmkvStore).forEach(k => delete mockMmkvStore[k])
  })

  it('registers an onAppUnlocked listener that invalidates the recurring-schedules cache', () => {
    const startListening = jest.fn()

    addRecurringSwapListeners(startListening as never)

    const call = startListening.mock.calls.find(
      c => c[0]?.actionCreator === onAppUnlocked
    )
    expect(call).toBeDefined()

    const effect = call?.[0].effect
    effect?.()

    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: RECURRING_SCHEDULES_QK
    })
  })

  it('starts the React Query cache subscriber on rehydration', () => {
    const startListening = jest.fn()

    expect(mockCacheSubscribers).toHaveLength(0)

    addRecurringSwapListeners(startListening as never)

    // The subscriber is wired lazily by the onRehydrationComplete effect, not
    // at registration time.
    expect(mockCacheSubscribers).toHaveLength(0)

    const call = startListening.mock.calls.find(
      c => c[0]?.actionCreator === onRehydrationComplete
    )
    expect(call).toBeDefined()

    const unsubscribe = jest.fn()
    const getState = jest.fn()
    call?.[0].effect(undefined, { unsubscribe, getState })

    // Fires exactly once and drops itself so the subscriber can't double-wire.
    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(mockCacheSubscribers).toHaveLength(1)
  })

  // The wired subscriber must read the kill-switch LIVE from
  // `listenerApi.getState()` on every matching cache event, not snapshot it at
  // wire time. These two cases lock in both branches through the real wiring
  // path.

  it('wires a live gate that reads state per event and subscribes when unblocked', async () => {
    const startListening = jest.fn()
    addRecurringSwapListeners(startListening as never)

    const call = startListening.mock.calls.find(
      c => c[0]?.actionCreator === onRehydrationComplete
    )
    const getState = jest.fn(() => ({}))
    call?.[0].effect(undefined, { unsubscribe: jest.fn(), getState })

    mockIsRecurringSwapsBlocked = false
    fireQueryUpdate([BASE_SCHEDULE])
    await flush()
    await flush()

    // getState was consulted for THIS event (live read, not a wire-time snapshot).
    expect(getState).toHaveBeenCalled()
    expect(mockSubscribeForRecurringSwap).toHaveBeenCalledTimes(1)
  })

  it('wires a live gate that skips the subscribe pass when blocked at event time', async () => {
    const startListening = jest.fn()
    addRecurringSwapListeners(startListening as never)

    const call = startListening.mock.calls.find(
      c => c[0]?.actionCreator === onRehydrationComplete
    )
    const getState = jest.fn(() => ({}))
    call?.[0].effect(undefined, { unsubscribe: jest.fn(), getState })

    mockIsRecurringSwapsBlocked = true
    fireQueryUpdate([BASE_SCHEDULE])
    await flush()
    await flush()

    expect(getState).toHaveBeenCalled()
    expect(mockSubscribeForRecurringSwap).not.toHaveBeenCalled()
  })
})
