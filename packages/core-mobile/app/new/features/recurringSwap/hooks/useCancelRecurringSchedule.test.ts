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
const mockClearPending = jest.fn()
const mockCapture = jest.fn()
const mockInvalidateQueries = jest.fn()
// Default: no network resolvable → the post-broadcast receipt watcher
// early-returns, so it's inert for every existing test. The revert test
// below overrides these to exercise the watch path.
const mockUseNetworks = jest.fn(() => ({
  networks: {} as Record<number, unknown>
}))
const mockWaitForTransaction = jest.fn()
const mockGetEvmProvider = jest.fn()

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
    getState: () => ({
      markPending: mockMarkPending,
      clearPending: mockClearPending
    })
  }
}))

// The hook reads the live networks map to resolve the source network for the
// receipt watcher; `getEvmProvider` turns that into an EVM provider.
jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => mockUseNetworks()
}))

jest.mock('services/network/utils/providerUtils', () => ({
  getEvmProvider: (...args: unknown[]) => mockGetEvmProvider(...args)
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
    mockClearPending.mockReset()
    mockCapture.mockReset()
    mockInvalidateQueries.mockReset()
    mockUseNetworks.mockReturnValue({ networks: {} })
    mockWaitForTransaction.mockReset()
    mockGetEvmProvider.mockReset()
    mockGetEvmProvider.mockResolvedValue({
      waitForTransaction: mockWaitForTransaction
    })
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
      TransferSignatureReason.CancelRecurringSwap,
      { ownerAddress: CANCEL_ARGS.address, chainId: CANCEL_ARGS.chainId }
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

  // Regression: `executeCancellation` resolves at broadcast, and
  // `RecurringOrderStatus` has no failed state — so a reverted action TX would
  // never advance the status the reconciler keys on, stranding the spinner
  // until the 10-min TTL. The post-broadcast receipt watcher must detect the
  // revert (`receipt.status === 0`), clear the pending entry, and surface a
  // failure snackbar.
  it('clears the pending entry and surfaces a failure snackbar when the action TX reverts on-chain', async () => {
    mockExecuteCancellation.mockResolvedValueOnce({ txHash: '0xtxhash' })
    mockUseNetworks.mockReturnValue({
      networks: { [CANCEL_ARGS.chainId]: { vmName: 'EVM' } }
    })
    mockWaitForTransaction.mockResolvedValueOnce({ status: 0 })

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      await result.current.mutateAsync(CANCEL_ARGS)
      // Flush the fire-and-forget watcher's microtask chain
      // (getEvmProvider → waitForTransaction → clearPending/snackbar).
      for (let i = 0; i < 5; i++) await Promise.resolve()
    })

    expect(mockWaitForTransaction).toHaveBeenCalledWith('0xtxhash', 1, 60_000)
    expect(mockClearPending).toHaveBeenCalledWith(CANCEL_ARGS.orderId)
    expect(mockSnackbar).toHaveBeenCalledWith(
      'Cancel failed on-chain. Please try again'
    )
  })

  // A successful (status 1) receipt must NOT clear the entry — the reconciler
  // owns the happy-path clear once Markr indexes the new status.
  it('leaves the pending entry intact when the action TX confirms successfully', async () => {
    mockExecuteCancellation.mockResolvedValueOnce({ txHash: '0xtxhash' })
    mockUseNetworks.mockReturnValue({
      networks: { [CANCEL_ARGS.chainId]: { vmName: 'EVM' } }
    })
    mockWaitForTransaction.mockResolvedValueOnce({ status: 1 })

    const { result } = renderHook(() => useCancelRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      await result.current.mutateAsync(CANCEL_ARGS)
      for (let i = 0; i < 5; i++) await Promise.resolve()
    })

    expect(mockClearPending).not.toHaveBeenCalled()
    expect(mockSnackbar).not.toHaveBeenCalled()
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

  // Regression: `executeCancellation` signs AND broadcasts internally, so a
  // non-HTTP, non-user-rejection error (e.g. a read timeout on the broadcast
  // response) is ambiguous — the TX may already be in the mempool. Re-enabling
  // the button would invite a double-submit, so the hook marks the order
  // pending (spinner persists, blocking the re-tap) and suppresses the failure
  // toast — it can't claim the action failed. The reconciler/TTL clears it.
  it('keeps the order pending without a toast when executeCancellation rejects with an ambiguous (non-HTTP) error', async () => {
    mockExecuteCancellation.mockRejectedValueOnce(
      new Error('read timeout after broadcast')
    )

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

    expect(mockMarkPending).toHaveBeenCalledWith(
      CANCEL_ARGS.orderId,
      TransferSignatureReason.CancelRecurringSwap,
      { ownerAddress: CANCEL_ARGS.address, chainId: CANCEL_ARGS.chainId }
    )
    expect(mockSnackbar).not.toHaveBeenCalled()
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
    // ...and the user's deliberate rejection must NOT leave a pending spinner.
    expect(mockMarkPending).not.toHaveBeenCalled()
  })

  // A generic signer/network failure thrown out of `executeCancellation` is
  // ambiguous (the TX may have broadcast) — covered by the "keeps the order
  // pending without a toast" regression above. The old behaviour of surfacing
  // a "Try again" toast here was removed: re-enabling on an ambiguous error
  // risks a double-submit. The `fallback` copy is still reached for failures
  // that provably precede broadcast (e.g. the `markrRecurring` namespace being
  // unavailable, which throws before `executeX` is ever called).
})
