import { renderHook, act } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  HttpError,
  TransferSignatureReason,
  type Chain
} from '@avalabs/fusion-sdk'
import React from 'react'
import { useCancelRecurringSchedule } from './useCancelRecurringSchedule'

// The hook calls `markrRecurring.executeCancellation` — the SDK signs and
// broadcasts internally. No ApprovalController dispatch from mobile, no
// calldata returned.
const mockExecuteCancellation = jest.fn()
const mockSnackbar = jest.fn()
const mockMarkPending = jest.fn()
const mockCapture = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return { executeCancellation: mockExecuteCancellation }
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

// Mock the unified pending-action store so the test doesn't need MMKV
// bindings. `markPending` takes (orderId, type) — the cancel-hook
// assertions below verify it's invoked with type 'cancel'.
jest.mock('../store/pendingActionStore', () => ({
  pendingActionStore: {
    getState: () => ({ markPending: mockMarkPending })
  }
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

// Builds a real `HttpError` instance — the hook's adapter uses `isHttpError`
// (which is `instanceof HttpError`) to discriminate.
const makeHttpError = (status: number): HttpError =>
  new HttpError('mock', { status, statusText: '' } as unknown as Response)

// Minimal Chain stub — the SDK is mocked, so the hook only passes this
// through to `executeCancellation` without reading its fields. We assert
// on the verbatim object below.
const SOURCE_CHAIN = {
  chainId: 'eip155:43114',
  chainName: 'Avalanche C-Chain',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
} as unknown as Chain

const CANCEL_ARGS = {
  orderId: '0xdead' as `0x${string}`,
  address: '0xabc',
  sourceChain: SOURCE_CHAIN,
  chainId: 43114,
  fromTokenSymbol: 'USDC',
  toTokenSymbol: 'AVAX'
} as const

describe('useCancelRecurringSchedule', () => {
  beforeEach(() => {
    mockExecuteCancellation.mockReset()
    mockSnackbar.mockReset()
    mockMarkPending.mockReset()
    mockCapture.mockReset()
    mockInvalidateQueries.mockReset()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('invokes markrRecurring.executeCancellation with the SDK shape, then marks pending + fires analytics', async () => {
    mockExecuteCancellation.mockResolvedValueOnce({ txHash: '0xtxhash' })

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      await result.current.mutateAsync(CANCEL_ARGS)
    })

    expect(mockExecuteCancellation).toHaveBeenCalledTimes(1)
    expect(mockExecuteCancellation).toHaveBeenCalledWith({
      orderId: CANCEL_ARGS.orderId,
      address: CANCEL_ARGS.address,
      sourceChain: SOURCE_CHAIN,
      // The SDK forwards this verbatim onto `step.signerContext`, where
      // EvmSigner.signOne attaches it as the approval modal's
      // RECURRING_SWAP context. `action` drives the cancel/pause/resume
      // copy distinction on the preview.
      signerContext: {
        action: TransferSignatureReason.CancelRecurringSwap,
        fromTokenSymbol: CANCEL_ARGS.fromTokenSymbol,
        toTokenSymbol: CANCEL_ARGS.toTokenSymbol
      }
    })

    // After broadcast we mark the orderId pending-cancel so the row stays
    // visible with a spinner instead of optimistically disappearing.
    // `pendingActionStore` stores the SDK `TransferSignatureReason` enum value
    // so `listeners.ts` can switch on the exact cancel/pause/resume reason.
    expect(mockMarkPending).toHaveBeenCalledWith(
      CANCEL_ARGS.orderId,
      TransferSignatureReason.CancelRecurringSwap
    )

    // Analytics fire from the hook on success (previously this lived in a
    // separate Redux listener watching the broadcast action).
    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapCancelledByUser', {
      chainId: CANCEL_ARGS.chainId,
      encrypted: {
        orderId: CANCEL_ARGS.orderId
      }
    })
  })

  it('does NOT mark the order pending when executeCancellation rejects', async () => {
    mockExecuteCancellation.mockRejectedValueOnce(makeHttpError(400))

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(CANCEL_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockMarkPending).not.toHaveBeenCalled()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('maps HttpError(400) → "already finished" toast', async () => {
    mockExecuteCancellation.mockRejectedValueOnce(makeHttpError(400))

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(CANCEL_ARGS)
      } catch {
        // expected — the hook rethrows after showing the snackbar
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith(
      'This schedule can no longer be cancelled'
    )
  })

  it('maps HttpError(404) → "not_found" toast', async () => {
    mockExecuteCancellation.mockRejectedValueOnce(makeHttpError(404))

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(CANCEL_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith('Unable to remove')
  })

  // User-rejection (tapping Reject or closing the modal) is the user's
  // deliberate action — surfacing "Try again" here gives a false impression
  // that the cancel attempt failed for a recoverable reason.
  it('does NOT show a snackbar when the user rejects the approval modal', async () => {
    mockExecuteCancellation.mockRejectedValueOnce(new Error('User rejected'))

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(CANCEL_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).not.toHaveBeenCalled()
  })

  it('shows "Try again" on a generic signer/network failure (not a user rejection)', async () => {
    mockExecuteCancellation.mockRejectedValueOnce(new Error('RPC timeout'))

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(CANCEL_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith('Try again')
  })
})
