import { renderHook, act } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpError, type Chain } from '@avalabs/fusion-sdk'
import React from 'react'
import { useUnpauseRecurringSchedule } from './useUnpauseRecurringSchedule'

const mockExecuteUnpause = jest.fn()
const mockSnackbar = jest.fn()
const mockMarkPending = jest.fn()
const mockCapture = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return { executeUnpause: mockExecuteUnpause }
    }
  }
}))

jest.mock('common/utils/toast', () => ({
  showSnackbar: (...args: unknown[]) => mockSnackbar(...args)
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: (...args: unknown[]) => mockCapture(...args) }
}))

jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args)
  }
}))

jest.mock('../store/pendingActionStore', () => ({
  pendingActionStore: {
    getState: () => ({ markPending: mockMarkPending })
  }
}))

const mockSetActive = jest.fn()
const mockClearActive = jest.fn()
jest.mock('../services/activeActionContext', () => ({
  setActiveRecurringActionContext: (...args: unknown[]) =>
    mockSetActive(...args),
  clearActiveRecurringActionContext: (...args: unknown[]) =>
    mockClearActive(...args)
}))

const wrap = ({ children }: { children: React.ReactNode }): JSX.Element =>
  React.createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false }
        }
      })
    },
    children
  )

const makeHttpError = (status: number): HttpError =>
  new HttpError('mock', { status, statusText: '' } as unknown as Response)

const SOURCE_CHAIN = {
  chainId: 'eip155:43114',
  chainName: 'Avalanche C-Chain',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
} as unknown as Chain

const UNPAUSE_ARGS = {
  orderId: '0xdead' as `0x${string}`,
  address: '0xabc',
  sourceChain: SOURCE_CHAIN,
  chainId: 43114,
  fromTokenSymbol: 'USDC',
  toTokenSymbol: 'AVAX'
} as const

describe('useUnpauseRecurringSchedule', () => {
  beforeEach(() => {
    mockExecuteUnpause.mockReset()
    mockSnackbar.mockReset()
    mockMarkPending.mockReset()
    mockCapture.mockReset()
    mockInvalidateQueries.mockReset()
    mockSetActive.mockReset()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('invokes markrRecurring.executeUnpause, marks pending, and fires RecurringSwapUnpausedByUser analytics', async () => {
    mockExecuteUnpause.mockResolvedValueOnce({ txHash: '0xtxhash' })

    const { result } = renderHook(() => useUnpauseRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      await result.current.mutateAsync(UNPAUSE_ARGS)
    })

    expect(mockExecuteUnpause).toHaveBeenCalledWith({
      orderId: UNPAUSE_ARGS.orderId,
      address: UNPAUSE_ARGS.address,
      sourceChain: SOURCE_CHAIN
    })

    expect(mockMarkPending).toHaveBeenCalledWith(
      UNPAUSE_ARGS.orderId,
      'unpause'
    )

    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapUnpausedByUser', {
      chainId: UNPAUSE_ARGS.chainId,
      encrypted: {
        orderId: UNPAUSE_ARGS.orderId
      }
    })

    expect(mockSetActive).toHaveBeenCalledWith({
      type: 'unpause',
      fromTokenSymbol: UNPAUSE_ARGS.fromTokenSymbol,
      toTokenSymbol: UNPAUSE_ARGS.toTokenSymbol
    })
  })

  it('maps HttpError(400) → "cannot be resumed" toast', async () => {
    mockExecuteUnpause.mockRejectedValueOnce(makeHttpError(400))

    const { result } = renderHook(() => useUnpauseRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(UNPAUSE_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith(
      'This schedule cannot be resumed right now'
    )
    expect(mockMarkPending).not.toHaveBeenCalled()
  })
})
