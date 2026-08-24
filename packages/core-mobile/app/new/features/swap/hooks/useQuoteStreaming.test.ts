import { renderHook, act } from '@testing-library/react-hooks'
import type { QuoterEventHandler, QuoterInterface } from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import type { NetworkWithCaip2ChainId } from 'store/network'
import FusionService from '../services/FusionService'
import { useQuoteStreaming } from './useQuoteStreaming'

jest.mock('../services/FusionService', () => ({
  __esModule: true,
  default: {
    getQuoter: jest.fn()
  }
}))

jest.mock('../utils/fusionTypeConverters', () => ({
  toSwappableAsset: jest.fn(() => ({})),
  toChain: jest.fn(() => ({}))
}))

jest.mock('../utils/fusionLogger', () => ({
  logSdkError: jest.fn()
}))

const mockCaptureMessage = jest.fn()
jest.mock('services/sentry/SentryService', () => ({
  __esModule: true,
  default: {
    captureMessage: (...args: unknown[]) => mockCaptureMessage(...args)
  }
}))

// The quote/ready stores are Zustand-backed; stub them so the hook sees the
// Fusion service as ready and we don't touch MMKV. The setter references must
// be STABLE — the hook's effect lists them as deps, so a fresh jest.fn() per
// render would re-subscribe every render and reset error/isLoading between
// them, making `result.current` unreliable.
const mockSetBestQuote = jest.fn()
const mockSetAllQuotes = jest.fn()
const mockSetReady = jest.fn()
jest.mock('./useZustandStore', () => ({
  useBestQuote: () => [null, mockSetBestQuote],
  useAllQuotes: () => [[], mockSetAllQuotes],
  useIsFusionServiceReady: () => [true, mockSetReady]
}))

const mockGetQuoter = jest.mocked(FusionService.getQuoter)

// Builds a fake quoter that captures the subscribed handler so tests can drive
// events, mirroring subscribeToFirstQuote.test.ts.
const makeQuoter = (): {
  quoter: QuoterInterface
  emit: (event: string, payload: unknown) => void
} => {
  let handler: QuoterEventHandler | undefined
  const quoter = {
    subscribe: (h: QuoterEventHandler) => {
      handler = h
      return jest.fn()
    }
  } as unknown as QuoterInterface
  return {
    quoter,
    emit: (event, payload) => handler?.(event as never, payload as never)
  }
}

const baseParams = {
  fromToken: {} as LocalTokenWithBalance,
  fromNetwork: {} as NetworkWithCaip2ChainId,
  toToken: {} as LocalTokenWithBalance,
  toNetwork: {} as NetworkWithCaip2ChainId,
  fromAddress: '0xfrom',
  toAddress: '0xto',
  slippageBps: 50
}

describe('useQuoteStreaming', () => {
  beforeEach(() => {
    mockGetQuoter.mockReset()
    mockCaptureMessage.mockReset()
  })

  it('stays silent when a zero-amount CCT recovery probe finds no quotes', () => {
    const { quoter, emit } = makeQuoter()
    mockGetQuoter.mockReturnValue(quoter)
    const onNoQuotesError = jest.fn()

    const { result } = renderHook(() =>
      useQuoteStreaming({
        ...baseParams,
        fromAmount: 0n,
        allowZeroAmount: true,
        onNoQuotesError
      })
    )

    act(() => emit('done', { reason: 'no-quotes', data: {} }))

    // Nothing is stranded → no "Quotes unavailable" alert, no inline error, and
    // no Sentry noise; "no quotes" is the normal outcome of a recovery probe.
    expect(onNoQuotesError).not.toHaveBeenCalled()
    expect(mockCaptureMessage).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('alerts when a real (positive-amount) quote request finds no quotes', () => {
    const { quoter, emit } = makeQuoter()
    mockGetQuoter.mockReturnValue(quoter)
    const onNoQuotesError = jest.fn()

    const { result } = renderHook(() =>
      useQuoteStreaming({
        ...baseParams,
        fromAmount: 100n,
        allowZeroAmount: true,
        onNoQuotesError
      })
    )

    act(() => emit('done', { reason: 'no-quotes', data: {} }))

    // A positive amount is a genuine swap attempt, so "no quotes" is a real
    // error worth alerting on, surfacing inline, and reporting to Sentry.
    expect(onNoQuotesError).toHaveBeenCalledTimes(1)
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1)
    expect(result.current.error).not.toBeNull()
  })

  // A bare chain-alias address (e.g. from an unvalidated Ledger reply, see
  // CP-14964) is truthy, so only the isBareChainPrefix check stops it here.
  it('does not create a quoter when toAddress is a bare chain prefix', () => {
    const { result } = renderHook(() =>
      useQuoteStreaming({
        ...baseParams,
        toAddress: 'P-',
        fromAmount: 100n
      })
    )

    // A corrupted address must surface as a real error, not fail silently —
    // it gets the same alert + Sentry treatment as a stream-level no-quotes.
    expect(mockGetQuoter).not.toHaveBeenCalled()
    expect(result.current.error).not.toBeNull()
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1)
  })

  it('does not create a quoter when fromAddress is a bare chain prefix', () => {
    const { result } = renderHook(() =>
      useQuoteStreaming({
        ...baseParams,
        fromAddress: 'P-',
        fromAmount: 100n
      })
    )

    expect(mockGetQuoter).not.toHaveBeenCalled()
    expect(result.current.error).not.toBeNull()
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1)
  })
})
