/**
 * Tests for startRecurringFailureWatcher() — the React Query cache subscriber
 * that detects new schedule failures, fires analytics, auto-cancels on
 * qualifying reasons, and tracks schedule completion.
 */

// ─── MMKV mock (must be before imports) ───────────────────────────────────────

// jest.mock() factory cannot close over out-of-scope `let` variables unless
// they are prefixed with `mock` (case-insensitive).
const mockMmkvStore: Record<string, string> = {}
jest.mock('utils/mmkv/storages', () => ({
  commonStorage: {
    getString: (k: string) => mockMmkvStore[k],
    set: (k: string, v: string) => {
      mockMmkvStore[k] = v
    }
  }
}))

// ─── Analytics mock ───────────────────────────────────────────────────────────

jest.mock('services/analytics/AnalyticsService', () => ({
  capture: jest.fn()
}))

// ─── Toast mock ───────────────────────────────────────────────────────────────

jest.mock('new/common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

// ─── Logger mock ──────────────────────────────────────────────────────────────

jest.mock('utils/Logger', () => ({
  warn: jest.fn(),
  error: jest.fn()
}))

// ─── RecurringSchedulesService singleton mock ─────────────────────────────────

const mockCancel = jest.fn()
jest.mock('../services/RecurringSchedulesService.singleton', () => ({
  getRecurringSchedulesService: () => ({ cancel: mockCancel })
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
import { showSnackbar } from 'new/common/utils/toast'
import type { Schedule } from '../types'
import { startRecurringFailureWatcher } from './listeners'

const captureSpy = AnalyticsService.capture as jest.Mock
const showSnackbarSpy = showSnackbar as jest.Mock

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SCHEDULES_QK_ROOT = 'recurringSchedules'

const BASE_SCHEDULE: Schedule = {
  orderId: '0xorder1',
  owner: '0xowner1',
  chainId: 43114,
  tokenIn: '0xtokenIn',
  tokenOut: '0xtokenOut',
  amount: '1000000',
  numberOfOrders: 4,
  executedOrders: 1,
  remainingOrders: 3,
  frequency: { unit: 'week', value: 1 },
  totalAmountIn: '4000000',
  tryCount: 0,
  failures: [],
  status: 'active',
  createdAt: 1700000000,
  nextExecutionAt: 1700000000 + 604800
}

/**
 * Simulate a React Query cache "updated" event for the recurring schedules
 * query with the given schedules array.
 */
function fireQueryUpdate(schedules: Schedule[]): void {
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

// Flush all microtasks + macrotasks so async work inside the watcher completes
const flush = () => new Promise<void>(r => setImmediate(r))

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('startRecurringFailureWatcher', () => {
  beforeEach(() => {
    Object.keys(mockMmkvStore).forEach(k => delete mockMmkvStore[k])
    mockCacheSubscribers = []
    mockCancel.mockReset()
    mockInvalidate.mockReset()
    captureSpy.mockReset()
    showSnackbarSpy.mockReset()
    mockCancel.mockResolvedValue({ ...BASE_SCHEDULE, status: 'cancelled' })
    // Register the watcher fresh for each test
    startRecurringFailureWatcher()
  })

  // ── 1. New failure detection + de-dup ──────────────────────────────────────

  it('fires RecurringSwapFailed once for a new failure', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1700001000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(captureSpy).toHaveBeenCalledWith('RecurringSwapFailed', {
      orderId: '0xorder1',
      chainId: 43114,
      executionIndex: 1,
      reasons: ['Quote expired before execution'],
      tryCount: 3,
      failedAt: 1700001000
    })
    expect(captureSpy).toHaveBeenCalledTimes(1)
    expect(showSnackbarSpy).toHaveBeenCalledWith(
      'Recurring swap execution failed'
    )
  })

  it('does NOT fire RecurringSwapFailed again for the same failure on a second update', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1700001000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()
    captureSpy.mockClear()
    showSnackbarSpy.mockClear()

    // Same snapshot again
    fireQueryUpdate([schedule])
    await flush()

    expect(captureSpy).not.toHaveBeenCalled()
    expect(showSnackbarSpy).not.toHaveBeenCalled()
  })

  // ── 2. Auto-cancel — qualifying reason on active schedule ──────────────────

  it('calls cancel() and fires RecurringSwapAutoCancelled for Slippage tolerance exceeded', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'active',
      failures: [
        {
          executionIndex: 2,
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1700002000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(mockCancel).toHaveBeenCalledWith({
      orderId: '0xorder1',
      address: '0xowner1'
    })

    expect(captureSpy).toHaveBeenCalledWith('RecurringSwapAutoCancelled', {
      orderId: '0xorder1',
      chainId: 43114,
      triggerReason: 'Slippage tolerance exceeded',
      executedOrders: 1,
      failedExecutionIndex: 2
    })

    expect(showSnackbarSpy).toHaveBeenCalledWith(
      'Recurring swap cancelled due to repeated failures'
    )

    expect(mockInvalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.any(Array) })
    )
  })

  it('calls cancel() and fires RecurringSwapAutoCancelled for Insufficient balance', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'active',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Insufficient balance'],
          tryCount: 2,
          failedAt: 1700003000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(mockCancel).toHaveBeenCalledTimes(1)
    expect(captureSpy).toHaveBeenCalledWith(
      'RecurringSwapAutoCancelled',
      expect.objectContaining({ triggerReason: 'Insufficient balance' })
    )
  })

  // ── 3. Non-qualifying reason — no auto-cancel ──────────────────────────────

  it('does NOT call cancel() for Quote expired before execution', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'active',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Quote expired before execution'],
          tryCount: 3,
          failedAt: 1700004000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(mockCancel).not.toHaveBeenCalled()
    expect(captureSpy).toHaveBeenCalledWith(
      'RecurringSwapFailed',
      expect.any(Object)
    )
    expect(captureSpy).not.toHaveBeenCalledWith(
      'RecurringSwapAutoCancelled',
      expect.any(Object)
    )
  })

  // ── 4. Auto-cancel only on active status ──────────────────────────────────

  it('does NOT call cancel() for qualifying reason on a paused schedule', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'paused',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Insufficient balance'],
          tryCount: 2,
          failedAt: 1700005000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(mockCancel).not.toHaveBeenCalled()
    // RecurringSwapFailed should still fire
    expect(captureSpy).toHaveBeenCalledWith(
      'RecurringSwapFailed',
      expect.any(Object)
    )
  })

  // ── 5. Completed analytics ────────────────────────────────────────────────

  it('fires RecurringSwapCompleted once when schedule is completed', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'completed',
      executedOrders: 4,
      remainingOrders: 0,
      nextExecutionAt: null,
      failures: []
    }

    fireQueryUpdate([schedule])
    await flush()

    expect(captureSpy).toHaveBeenCalledWith('RecurringSwapCompleted', {
      orderId: '0xorder1',
      chainId: 43114,
      executedOrders: 4
    })
    expect(captureSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire RecurringSwapCompleted again on a second update with same completed status', async () => {
    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'completed',
      executedOrders: 4,
      remainingOrders: 0,
      nextExecutionAt: null,
      failures: []
    }

    fireQueryUpdate([schedule])
    await flush()
    captureSpy.mockClear()

    fireQueryUpdate([schedule])
    await flush()

    expect(captureSpy).not.toHaveBeenCalled()
  })

  // ── 6. Cancel POST failure — rollback so retry can re-attempt ─────────────

  it('rolls back autoCancelled if cancel() rejects, allowing retry on next refetch', async () => {
    mockCancel.mockRejectedValueOnce(new Error('network error'))

    const schedule: Schedule = {
      ...BASE_SCHEDULE,
      status: 'active',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1700006000
        }
      ]
    }

    fireQueryUpdate([schedule])
    await flush()

    // First call: cancel fails — no AutoCancelled event, no invalidation
    expect(captureSpy).not.toHaveBeenCalledWith(
      'RecurringSwapAutoCancelled',
      expect.any(Object)
    )
    expect(mockInvalidate).not.toHaveBeenCalled()

    // RecurringSwapFailed should still have fired
    expect(captureSpy).toHaveBeenCalledWith(
      'RecurringSwapFailed',
      expect.any(Object)
    )

    // Reset cancel to succeed on the retry
    mockCancel.mockResolvedValueOnce({ ...BASE_SCHEDULE, status: 'cancelled' })
    captureSpy.mockClear()

    // Same failure reappears on next refetch — the failure itself is already
    // de-duped in seenFailures, so RecurringSwapFailed won't re-fire. But the
    // auto-cancel should be retried because the rollback cleared autoCancelled.
    //
    // To simulate a new/different failure that re-triggers the auto-cancel path
    // on an order where cancel was previously rolled back:
    const scheduleWithNewFailure: Schedule = {
      ...BASE_SCHEDULE,
      status: 'active',
      failures: [
        {
          executionIndex: 1,
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1700006000
        },
        {
          executionIndex: 2, // NEW failure — will pass the seenFailures de-dup
          reasons: ['Slippage tolerance exceeded'],
          tryCount: 3,
          failedAt: 1700007000
        }
      ]
    }

    fireQueryUpdate([scheduleWithNewFailure])
    await flush()

    // This time cancel should succeed
    expect(mockCancel).toHaveBeenCalledTimes(2)
    expect(captureSpy).toHaveBeenCalledWith(
      'RecurringSwapAutoCancelled',
      expect.any(Object)
    )
  })

  // ── 7. Non-matching query key is ignored ──────────────────────────────────

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
    expect(mockCancel).not.toHaveBeenCalled()
  })

  // ── 8. Non-success status is ignored ─────────────────────────────────────

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
})
