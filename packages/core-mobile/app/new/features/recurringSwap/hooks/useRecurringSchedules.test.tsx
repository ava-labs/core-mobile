import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRecurringSchedules } from './useRecurringSchedules'

const mockList = jest.fn()
jest.mock('../services/RecurringSchedulesService.singleton', () => ({
  getRecurringSchedulesService: () => ({ list: mockList })
}))

const wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('useRecurringSchedules', () => {
  beforeEach(() => mockList.mockReset())

  it('queries with address + chainId, omits status to capture all four', async () => {
    mockList.mockResolvedValueOnce([{ orderId: '0xa', status: 'active' }])
    const { result, waitFor } = renderHook(() => useRecurringSchedules('0xabc', 43114), { wrapper: wrap })
    await waitFor(() => expect(result.current.data?.length).toBe(1))
    expect(mockList).toHaveBeenCalledWith({ address: '0xabc', chainId: 43114 })
  })

  it('does not fire without address', () => {
    renderHook(() => useRecurringSchedules(undefined, 43114), { wrapper: wrap })
    expect(mockList).not.toHaveBeenCalled()
  })
})
