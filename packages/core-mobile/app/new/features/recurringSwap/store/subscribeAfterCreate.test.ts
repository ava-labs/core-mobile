/**
 * CP-14651 regression guard.
 *
 * Creating a recurring swap must end with this device subscribed for that
 * order's push notifications. The client has no orderId at broadcast time
 * (`executeFirstFill` returns only `{ txHash }`), so the only route to a
 * subscription is `ensureOrderSubscriptions` seeing the order in a landed
 * `listOrders` snapshot — which means a refetch has to happen AFTER Markr's
 * indexer catches up, several seconds later.
 *
 * The create flow works against that:
 *   1. `submitRecurringSwap` invalidates at broadcast, while SwapScreen (and
 *      therefore its `RecurringSchedulesBanner` observer) is still mounted —
 *      but Markr hasn't indexed the order yet, so the snapshot is empty.
 *   2. `scheduleStaggeredInvalidate` queues catch-up invalidates at t=5/15/30s
 *      to cover exactly that lag.
 *   3. `SwapScreen` then calls `dismissAll()`, dropping the only observer.
 *
 * `queryClient.invalidateQueries` defaults to `refetchType: 'active'`, so once
 * the modal is gone those catch-up invalidates mark the query stale and refetch
 * nothing. The order never lands, the cache subscriber never fires, and the
 * device is never subscribed — no push and no notification-center row.
 *
 * This test drives a REAL QueryClient (not the hand-rolled cache-event fake the
 * sibling `listeners.test.ts` uses) because the bug lives in React Query's
 * active-vs-inactive refetch semantics; a fake that just invokes subscribers
 * cannot express it.
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

// ─── Ambient mocks ────────────────────────────────────────────────────────────

jest.mock('common/utils/toast', () => ({ showSnackbar: jest.fn() }))

jest.mock('utils/Logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}))

jest.mock('./pendingActionStore', () => ({
  pendingActionStore: {
    getState: () => ({
      pending: {},
      markPending: jest.fn(),
      clearPending: jest.fn(),
      isExpired: () => false
    })
  }
}))

jest.mock('store/posthog', () => ({
  selectIsRecurringSwapsBlocked: () => false
}))

// ─── Network boundaries ───────────────────────────────────────────────────────

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

jest.mock('services/notifications/registerDeviceToNotificationSender', () => ({
  registerAndGetDeviceArn: () => Promise.resolve('arn:registered-fallback')
}))

// ─── Real QueryClient, injected where the app reads its singleton ─────────────
// A getter (not a plain property) so the instance is resolved at each use site
// rather than at module-require time — `jest.mock` factories are hoisted above
// the `let` below, so an eager read would hit the uninitialised binding.

let mockQueryClient: QueryClient
jest.mock('contexts/ReactQueryProvider', () => ({
  get queryClient() {
    return mockQueryClient
  }
}))

// ─── Subject under test ───────────────────────────────────────────────────────

import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { CommonStorageKeys } from 'utils/mmkv'
import { recurringSchedulesQueryKey } from '../hooks/useRecurringSchedules'
import { RecurringOrderStatus, type RecurringOrder } from '../types'
import { scheduleStaggeredInvalidate } from '../utils/staggeredInvalidate'
import { startRecurringFailureWatcher } from './listeners'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const OWNER = '0xOwner1'
const CHAIN_ID = 43114
const DEVICE_ARN = 'arn:test-device'
const SCHEDULES_KEY = recurringSchedulesQueryKey(OWNER, CHAIN_ID)

/** The order Markr surfaces a few seconds after the first fill is broadcast. */
const NEW_ORDER = {
  orderId: '0xorder-just-created',
  owner: OWNER,
  chainId: CHAIN_ID,
  status: RecurringOrderStatus.Active,
  numberOfOrders: 3,
  executedOrders: 1,
  remainingOrders: 2,
  failures: []
} as unknown as RecurringOrder

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CP-14651 — subscribing the order created in a dismissed swap modal', () => {
  let stopWatcher: () => void
  // Flipped to true to model Markr's indexer catching up post-broadcast.
  let isIndexed: boolean

  const listOrders = jest.fn(async () => (isIndexed ? [NEW_ORDER] : []))

  beforeEach(() => {
    jest.useFakeTimers()

    Object.keys(mockMmkvStore).forEach(k => delete mockMmkvStore[k])
    mockMmkvStore[CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION] = DEVICE_ARN

    mockQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })

    isIndexed = false
    listOrders.mockClear()
    mockSubscribeForRecurringSwap.mockClear()

    stopWatcher = startRecurringFailureWatcher(() => false)
  })

  afterEach(() => {
    stopWatcher()
    mockQueryClient.clear()
    jest.useRealTimers()
  })

  /**
   * Stands in for the `RecurringSchedulesBanner` observer that SwapScreen
   * mounts. Returns the teardown that models `dismissAll()`.
   */
  const mountSchedulesObserver = (): (() => void) => {
    const observer = new QueryObserver(mockQueryClient, {
      queryKey: SCHEDULES_KEY,
      queryFn: listOrders,
      staleTime: 5 * 60_000
    })
    return observer.subscribe(() => undefined)
  }

  it('subscribes the new order even though the modal unmounts before Markr indexes it', async () => {
    // SwapScreen is open: the banner observes this account's schedules.
    const dismissModal = mountSchedulesObserver()
    await jest.advanceTimersByTimeAsync(0)
    expect(mockSubscribeForRecurringSwap).not.toHaveBeenCalled()

    // First fill broadcast → invalidate at broadcast. Markr hasn't indexed the
    // order yet, so this refetch returns an empty list and there is nothing to
    // subscribe.
    mockQueryClient.invalidateQueries({ queryKey: SCHEDULES_KEY })
    await jest.advanceTimersByTimeAsync(0)
    expect(mockSubscribeForRecurringSwap).not.toHaveBeenCalled()

    // The catch-up batch is queued for t=5/15/30s...
    scheduleStaggeredInvalidate(SCHEDULES_KEY)

    // ...Markr indexes the order...
    isIndexed = true

    // ...and SwapScreen dismisses itself, dropping the only observer.
    dismissModal()

    // Let the entire catch-up window elapse.
    await jest.advanceTimersByTimeAsync(31_000)

    expect(mockSubscribeForRecurringSwap).toHaveBeenCalledWith({
      orderId: NEW_ORDER.orderId,
      deviceArn: DEVICE_ARN
    })
  })

  it('still subscribes when the user leaves a schedules-observing screen mounted', async () => {
    // Control case: same flow, but the observer survives (e.g. Swap was opened
    // from the Activity tab, so ActivityScreen's banner stays mounted under the
    // modal). This path already worked before the fix — it is here so a
    // regression in the fix cannot pass by breaking the happy path.
    mountSchedulesObserver()
    await jest.advanceTimersByTimeAsync(0)

    mockQueryClient.invalidateQueries({ queryKey: SCHEDULES_KEY })
    await jest.advanceTimersByTimeAsync(0)

    scheduleStaggeredInvalidate(SCHEDULES_KEY)
    isIndexed = true
    await jest.advanceTimersByTimeAsync(31_000)

    expect(mockSubscribeForRecurringSwap).toHaveBeenCalledWith({
      orderId: NEW_ORDER.orderId,
      deviceArn: DEVICE_ARN
    })
  })
})
