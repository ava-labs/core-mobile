import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TokenType } from '@avalabs/vm-module-types'
import React from 'react'
import {
  useRecurringQuote,
  computeRecurringQuoteRefetchInterval,
  RECURRING_QUOTE_REFRESH_BUFFER_MS,
  RECURRING_QUOTE_REFRESH_FLOOR_MS
} from './useRecurringQuote'

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
        type: TokenType.ERC20,
        address: '0x' + 'a'.repeat(40),
        networkChainId: 43114,
        decimals: 6,
        symbol: 'USDC'
      },
      toToken: {
        type: TokenType.ERC20,
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

  // Regression: a non-empty `address` is not sufficient — an SPL token carries
  // a (non-empty) Solana address but is not an EVM ERC-20, so the gate must
  // keep the query disabled rather than letting `resolveRecurringTokenAddress`
  // resolve it to '' and feed an empty address into the SDK.
  it('does not fire for an unsupported token type with a non-empty address', () => {
    const params = {
      fromToken: {
        type: TokenType.NATIVE,
        address: '',
        networkChainId: 43114,
        decimals: 18,
        symbol: 'AVAX'
      },
      toToken: {
        // SPL token: non-empty address, but not ERC-20.
        type: TokenType.SPL,
        address: 'So11111111111111111111111111111111111111112',
        networkChainId: 43114,
        decimals: 9,
        symbol: 'WSOL'
      },
      amountPerOrder: 10_000_000n,
      numberOfOrders: 12,
      frequency: { unit: 'day' as const, value: 1 }
    }
    renderHook(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => useRecurringQuote(params as any),
      { wrapper: wrap }
    )
    expect(mockQuote).not.toHaveBeenCalled()
  })
})

describe('computeRecurringQuoteRefetchInterval', () => {
  const NOW = 1_000_000_000_000 // fixed reference time in ms

  it('returns false when there is no quote yet (nothing to keep alive)', () => {
    expect(computeRecurringQuoteRefetchInterval(undefined, NOW)).toBe(false)
  })

  it('schedules the refetch a buffer before the quote expires', () => {
    // Expires 60s from now → refetch (60s - buffer) from now.
    const expiredAt = NOW / 1000 + 60
    expect(computeRecurringQuoteRefetchInterval(expiredAt, NOW)).toBe(
      60_000 - RECURRING_QUOTE_REFRESH_BUFFER_MS
    )
  })

  it('floors the interval for a quote near expiry instead of busy-looping', () => {
    // Expires in 2s → naive (2s - buffer) is negative → clamp to the floor.
    const expiredAt = NOW / 1000 + 2
    expect(computeRecurringQuoteRefetchInterval(expiredAt, NOW)).toBe(
      RECURRING_QUOTE_REFRESH_FLOOR_MS
    )
  })

  it('floors the interval for an already-expired quote', () => {
    const expiredAt = NOW / 1000 - 30 // expired 30s ago
    expect(computeRecurringQuoteRefetchInterval(expiredAt, NOW)).toBe(
      RECURRING_QUOTE_REFRESH_FLOOR_MS
    )
  })
})
