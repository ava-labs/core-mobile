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

type PendingEntry = { type: 'cancel' | 'pause' | 'unpause'; addedAt: number }

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

// ─── Subject under test ───────────────────────────────────────────────────────

import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from 'common/utils/toast'
import { RecurringOrderStatus, type RecurringOrder } from '../types'
import { startRecurringFailureWatcher } from './listeners'

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
    startRecurringFailureWatcher()
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
  // Cancel / pause / unpause each have their own "resolved" destination
  // status. The reconciler picks the right one off `entry.type` — the tests
  // below cover each branch plus the safety nets (order vanished, TTL).

  const pendingEntry = (type: PendingEntry['type']): PendingEntry => ({
    type,
    addedAt: Date.now()
  })

  it('clears pending-cancel entry once the order status flips to cancelled', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('cancel') }

    fireQueryUpdate([
      { ...BASE_SCHEDULE, status: RecurringOrderStatus.Cancelled }
    ])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('keeps pending-cancel entry while the order is still reported as active', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('cancel') }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  // Regression: a `status !== Active` check would clear the spinner the
  // moment the next refetch lands (the order was already Paused before
  // the cancel TX was even broadcast), flickering the row back to
  // Pause/Unpause buttons until the actual Cancelled status indexes.
  it('keeps pending-cancel entry while the order is still reported as paused (cancel-from-Paused)', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('cancel') }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Paused }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  it('clears pending-pause entry once the order status flips to paused', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('pause') }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Paused }])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('keeps pending-pause entry while the order is still reported as active', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('pause') }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  it('clears pending-unpause entry once the order status flips back to active', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('unpause') }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('keeps pending-unpause entry while the order is still reported as paused', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('unpause') }

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Paused }])
    await flush()

    expect(mockPendingStoreState.clearPending).not.toHaveBeenCalled()
  })

  it('clears pending-action entry when the order vanishes from the response', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('cancel') }

    fireQueryUpdate([])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })

  it('clears pending-action entry once the TTL has elapsed even if the order is still in its starting state', async () => {
    mockPendingStoreState.pending = { '0xorder1': pendingEntry('pause') }
    mockPendingStoreState.isExpired = jest.fn((id: string) => id === '0xorder1')

    fireQueryUpdate([{ ...BASE_SCHEDULE, status: RecurringOrderStatus.Active }])
    await flush()

    expect(mockPendingStoreState.clearPending).toHaveBeenCalledWith('0xorder1')
  })
})
