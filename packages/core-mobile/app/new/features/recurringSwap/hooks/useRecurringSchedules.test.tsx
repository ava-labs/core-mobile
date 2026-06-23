import { act, renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  RECURRING_SCHEDULES_QK,
  useRecurringSchedules
} from './useRecurringSchedules'

const mockListOrders = jest.fn()
jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return { listOrders: mockListOrders }
    }
  }
}))

jest.mock('features/swap/hooks/useZustandStore', () => ({
  useIsFusionServiceReady: () => [true]
}))

// Shared QueryClient for the simple cases. Each test below that needs a
// dedicated client constructs its own and an inline wrapper using the
// same single-line destructured-arrow pattern (babel's TS preset here
// chokes on multi-line param type annotations, so we keep them inline).
const sharedClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})
// prettier-ignore
const wrap = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <QueryClientProvider client={sharedClient}>{children}</QueryClientProvider>
)

describe('useRecurringSchedules', () => {
  beforeEach(() => mockListOrders.mockReset())
  // Safety net: the `forwards refetchIntervalMs` test switches to fake
  // timers. If it throws before reaching `useRealTimers()`, subsequent
  // tests in this worker would deadlock against RQ's setTimeout. Restore
  // unconditionally so each test starts on real timers.
  afterEach(() => {
    jest.useRealTimers()
  })

  it('queries with address + chainId, omits status to capture all four', async () => {
    mockListOrders.mockResolvedValueOnce({
      address: '0xabc',
      count: 1,
      orders: [{ orderId: '0xa', status: 'active' }]
    })
    const { result, waitFor } = renderHook(
      () => useRecurringSchedules('0xabc', 43114),
      { wrapper: wrap }
    )
    await waitFor(() => expect(result.current.data?.length).toBe(1))
    expect(mockListOrders).toHaveBeenCalledWith({
      address: '0xabc',
      chainId: 43114
    })
  })

  it('does not fire without address', () => {
    renderHook(() => useRecurringSchedules(undefined, 43114), { wrapper: wrap })
    expect(mockListOrders).not.toHaveBeenCalled()
  })

  it('forwards refetchIntervalMs to refetchInterval (poll triggers refetch)', async () => {
    jest.useFakeTimers()
    mockListOrders.mockResolvedValue({
      address: '0xabc',
      count: 0,
      orders: []
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    // prettier-ignore
    const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { waitFor } = renderHook(
      () =>
        useRecurringSchedules('0xabc', 43114, {
          refetchIntervalMs: 1_000
        }),
      { wrapper }
    )
    await waitFor(() => expect(mockListOrders).toHaveBeenCalledTimes(1))
    // Advance past the interval — refetchInterval should fire another call.
    // Wrap in `act` so React Query's notify-driven re-render lands inside
    // the act batch and the test doesn't log an act warning.
    await act(async () => {
      jest.advanceTimersByTime(1_100)
    })
    await waitFor(() => expect(mockListOrders).toHaveBeenCalledTimes(2))
    jest.useRealTimers()
  })

  it('forwards staleTime: 0 so the next observer mount refetches', async () => {
    // Shared QueryClient between two renders so the cache persists across
    // the unmount. With default staleTime (5 min) the second observer
    // would hydrate from cache without refetching; with staleTime: 0 it
    // should fire `listOrders` again.
    mockListOrders.mockResolvedValue({
      address: '0xabc',
      count: 0,
      orders: []
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    // prettier-ignore
    const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const first = renderHook(
      () => useRecurringSchedules('0xabc', 43114, { staleTime: 0 }),
      { wrapper }
    )
    await first.waitFor(() => expect(mockListOrders).toHaveBeenCalledTimes(1))
    first.unmount()

    // Sanity: cache still holds the data after unmount (gcTime default).
    expect(
      client.getQueryData([...RECURRING_SCHEDULES_QK, '0xabc', 43114])
    ).toBeDefined()

    const second = renderHook(
      () => useRecurringSchedules('0xabc', 43114, { staleTime: 0 }),
      { wrapper }
    )
    await second.waitFor(() => expect(mockListOrders).toHaveBeenCalledTimes(2))
  })

  it('does NOT refetch on second mount when staleTime is left at default', async () => {
    // Mirror of the test above to confirm the staleTime: 0 forwarding is
    // load-bearing (and not just incidental from some other refetch path).
    mockListOrders.mockResolvedValue({
      address: '0xabc',
      count: 0,
      orders: []
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    // prettier-ignore
    const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const first = renderHook(() => useRecurringSchedules('0xabc', 43114), {
      wrapper
    })
    await first.waitFor(() => expect(mockListOrders).toHaveBeenCalledTimes(1))
    first.unmount()

    renderHook(() => useRecurringSchedules('0xabc', 43114), { wrapper })
    // Give RQ a tick — if it were going to refetch, it would have queued.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(mockListOrders).toHaveBeenCalledTimes(1)
  })
})
