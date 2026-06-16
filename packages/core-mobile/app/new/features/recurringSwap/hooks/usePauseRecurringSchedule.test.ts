import { renderHook, act } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpError, type Chain } from '@avalabs/fusion-sdk'
import React from 'react'
import { usePauseRecurringSchedule } from './usePauseRecurringSchedule'

const mockExecutePause = jest.fn()
const mockSnackbar = jest.fn()
const mockMarkPending = jest.fn()
const mockCapture = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return { executePause: mockExecutePause }
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

const PAUSE_ARGS = {
  orderId: '0xdead' as `0x${string}`,
  address: '0xabc',
  sourceChain: SOURCE_CHAIN,
  chainId: 43114,
  fromTokenSymbol: 'USDC',
  toTokenSymbol: 'AVAX'
} as const

describe('usePauseRecurringSchedule', () => {
  beforeEach(() => {
    mockExecutePause.mockReset()
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

  it('invokes markrRecurring.executePause, marks pending, and fires RecurringSwapPausedByUser analytics', async () => {
    mockExecutePause.mockResolvedValueOnce({ txHash: '0xtxhash' })

    const { result } = renderHook(() => usePauseRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      await result.current.mutateAsync(PAUSE_ARGS)
    })

    expect(mockExecutePause).toHaveBeenCalledWith({
      orderId: PAUSE_ARGS.orderId,
      address: PAUSE_ARGS.address,
      sourceChain: SOURCE_CHAIN
    })

    expect(mockMarkPending).toHaveBeenCalledWith(PAUSE_ARGS.orderId, 'pause')

    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapPausedByUser', {
      encrypted: {
        orderId: PAUSE_ARGS.orderId,
        chainId: PAUSE_ARGS.chainId
      }
    })

    expect(mockSetActive).toHaveBeenCalledWith({
      type: 'pause',
      fromTokenSymbol: PAUSE_ARGS.fromTokenSymbol,
      toTokenSymbol: PAUSE_ARGS.toTokenSymbol
    })
  })

  it('does NOT mark the order pending when executePause fails', async () => {
    mockExecutePause.mockRejectedValueOnce(makeHttpError(400))

    const { result } = renderHook(() => usePauseRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(PAUSE_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockMarkPending).not.toHaveBeenCalled()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('maps HttpError(400) → "cannot be paused" toast', async () => {
    mockExecutePause.mockRejectedValueOnce(makeHttpError(400))

    const { result } = renderHook(() => usePauseRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(PAUSE_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith(
      'This schedule cannot be paused right now'
    )
  })

  it('shows "Try again" when the signer rejects', async () => {
    mockExecutePause.mockRejectedValueOnce(new Error('user rejected'))

    const { result } = renderHook(() => usePauseRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(PAUSE_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith('Try again')
  })
})
