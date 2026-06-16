import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRecurringSchedules } from './useRecurringSchedules'

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

const wrap = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('useRecurringSchedules', () => {
  beforeEach(() => mockListOrders.mockReset())

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
})
