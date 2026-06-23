import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRecurringQuote } from './useRecurringQuote'

const mockQuote = jest.fn()
jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return { quote: mockQuote }
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

describe('useRecurringQuote', () => {
  beforeEach(() => mockQuote.mockReset())

  it('does not fire when params are incomplete', () => {
    renderHook(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => useRecurringQuote({ fromToken: undefined } as any),
      {
        wrapper: wrap
      }
    )
    expect(mockQuote).not.toHaveBeenCalled()
  })

  it('fires when params are complete', async () => {
    mockQuote.mockResolvedValueOnce({
      uuid: 'u',
      totalAmountIn: 120n,
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
      amountPerOrder: 10_000_000n,
      numberOfOrders: 12,
      frequency: { unit: 'day' as const, value: 1 }
    }
    const { result, waitFor } = renderHook(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => useRecurringQuote(params as any),
      { wrapper: wrap }
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(mockQuote).toHaveBeenCalledTimes(1)
  })
})
