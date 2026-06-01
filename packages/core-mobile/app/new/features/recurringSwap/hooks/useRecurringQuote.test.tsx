import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRecurringQuote } from './useRecurringQuote'

const mockQuote = jest.fn()
jest.mock('../services/RecurringSwapService.singleton', () => ({
  getRecurringSwapService: () => ({ recurringQuote: mockQuote })
}))

const wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('useRecurringQuote', () => {
  beforeEach(() => mockQuote.mockReset())

  it('does not fire when params are incomplete', () => {
    renderHook(() => useRecurringQuote({ fromToken: undefined } as any), {
      wrapper: wrap
    })
    expect(mockQuote).not.toHaveBeenCalled()
  })

  it('fires when params are complete', async () => {
    mockQuote.mockResolvedValueOnce({
      uuid: 'u',
      totalAmountIn: '120',
      fees: []
    })
    const params = {
      fromToken: {
        address: '0x' + 'a'.repeat(40),
        networkChainId: 43114,
        decimals: 6,
        symbol: 'USDC'
      },
      toToken: {
        address: '0x' + 'b'.repeat(40),
        networkChainId: 43114,
        decimals: 18,
        symbol: 'WAVAX'
      },
      amountPerOrder: 10000000n,
      numberOfOrders: 12,
      frequency: { unit: 'day' as const, value: 1 }
    }
    const { result, waitFor } = renderHook(
      () => useRecurringQuote(params as any),
      { wrapper: wrap }
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockQuote).toHaveBeenCalledTimes(1)
  })
})
