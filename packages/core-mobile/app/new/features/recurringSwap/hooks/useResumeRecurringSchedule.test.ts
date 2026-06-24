import { renderHook, act } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  HttpError,
  TransferSignatureReason,
  type Chain
} from '@avalabs/fusion-sdk'
import React from 'react'
import { useResumeRecurringSchedule } from './useResumeRecurringSchedule'

const mockExecuteResume = jest.fn()
const mockSnackbar = jest.fn()
const mockMarkPending = jest.fn()
const mockCapture = jest.fn()
const mockInvalidateQueries = jest.fn()
// No network resolvable → the post-broadcast receipt watcher early-returns,
// so it's inert here (the revert path is covered in the cancel hook test,
// which exercises the shared `_makeOrderActionHook` watcher).
const mockGetEvmProvider = jest.fn()

// Markr's SDK still names the namespace method `executeUnpause`; only
// our consumer-facing naming changed to "resume". This mock mirrors the
// SDK's surface.
jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return { executeUnpause: mockExecuteResume }
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

jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => ({ networks: {} })
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

const makeHttpError = (status: number): HttpError =>
  new HttpError('mock', { status, statusText: '' } as unknown as Response)

const SOURCE_CHAIN = {
  chainId: 'eip155:43114',
  chainName: 'Avalanche C-Chain',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
} as unknown as Chain

const RESUME_ARGS = {
  orderId: '0xdead' as `0x${string}`,
  address: '0xabc',
  sourceChain: SOURCE_CHAIN,
  chainId: 43114,
  fromTokenSymbol: 'USDC',
  toTokenSymbol: 'AVAX'
} as const

describe('useResumeRecurringSchedule', () => {
  beforeEach(() => {
    mockExecuteResume.mockReset()
    mockSnackbar.mockReset()
    mockMarkPending.mockReset()
    mockCapture.mockReset()
    mockInvalidateQueries.mockReset()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('invokes markrRecurring.executeUnpause, marks pending, and fires RecurringSwapResumedByUser analytics', async () => {
    mockExecuteResume.mockResolvedValueOnce({ txHash: '0xtxhash' })

    const { result } = renderHook(() => useResumeRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      await result.current.mutateAsync(RESUME_ARGS)
    })

    expect(mockExecuteResume).toHaveBeenCalledWith({
      orderId: RESUME_ARGS.orderId,
      address: RESUME_ARGS.address,
      sourceChain: SOURCE_CHAIN,
      // The SDK forwards this verbatim onto `step.signerContext`, where
      // EvmSigner.signOne attaches it as the approval modal's
      // RECURRING_SWAP context. `action` drives the resume-specific
      // copy on the preview.
      signerContext: {
        action: TransferSignatureReason.ResumeRecurringSwap,
        fromTokenSymbol: RESUME_ARGS.fromTokenSymbol,
        toTokenSymbol: RESUME_ARGS.toTokenSymbol
      }
    })

    expect(mockMarkPending).toHaveBeenCalledWith(
      RESUME_ARGS.orderId,
      TransferSignatureReason.ResumeRecurringSwap,
      { ownerAddress: RESUME_ARGS.address, chainId: RESUME_ARGS.chainId }
    )

    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapResumedByUser', {
      chainId: RESUME_ARGS.chainId,
      encrypted: {
        orderId: RESUME_ARGS.orderId
      }
    })
  })

  it('maps HttpError(400) → "cannot be resumed" toast', async () => {
    mockExecuteResume.mockRejectedValueOnce(makeHttpError(400))

    const { result } = renderHook(() => useResumeRecurringSchedule(), {
      wrapper: wrap
    })

    await act(async () => {
      try {
        await result.current.mutateAsync(RESUME_ARGS)
      } catch {
        /* rethrown */
      }
    })

    expect(mockSnackbar).toHaveBeenCalledWith(
      'This recurring schedule cannot be resumed right now'
    )
    expect(mockMarkPending).not.toHaveBeenCalled()
  })
})
