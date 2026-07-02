import type { QuoterEventHandler, QuoterInterface } from '@avalabs/fusion-sdk'
import FusionService from '../services/FusionService'
import type { Quote } from '../types'
import type { QuoterParams } from '../services/types'
import { subscribeToFirstQuote } from './subscribeToFirstQuote'

jest.mock('../services/FusionService', () => ({
  __esModule: true,
  default: {
    getQuoter: jest.fn()
  }
}))

jest.mock('./fusionLogger', () => ({
  logSdkError: jest.fn()
}))

const mockGetQuoter = jest.mocked(FusionService.getQuoter)

const params = {} as QuoterParams
const bestQuote = { amountOut: 42n } as unknown as Quote

// Builds a fake quoter that captures the subscribed handler so tests can drive
// events, and exposes the unsubscribe spy the util is expected to call.
const makeQuoter = (): {
  quoter: QuoterInterface
  unsubscribe: jest.Mock
  emit: (event: string, payload: unknown) => void
} => {
  const unsubscribe = jest.fn()
  let handler: QuoterEventHandler | undefined
  const quoter = {
    subscribe: (h: QuoterEventHandler) => {
      handler = h
      return unsubscribe
    }
  } as unknown as QuoterInterface
  return {
    quoter,
    unsubscribe,
    // Cast through never so a single helper can drive the discriminated
    // (event, payload) tuple union without per-event overloads.
    emit: (event, payload) => handler?.(event as never, payload as never)
  }
}

describe('subscribeToFirstQuote', () => {
  beforeEach(() => {
    mockGetQuoter.mockReset()
  })

  it('resolves on the first quote and unsubscribes', () => {
    const { quoter, unsubscribe, emit } = makeQuoter()
    mockGetQuoter.mockReturnValue(quoter)
    const onQuote = jest.fn()
    const onFailed = jest.fn()

    subscribeToFirstQuote(params, onQuote, onFailed)
    emit('quote', { bestQuote, quote: bestQuote, quotes: [bestQuote] })

    expect(onQuote).toHaveBeenCalledWith(bestQuote)
    expect(onFailed).not.toHaveBeenCalled()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it.each(['done', 'error'] as const)(
    'calls onFailed on %s before any quote and unsubscribes',
    event => {
      const { quoter, unsubscribe, emit } = makeQuoter()
      mockGetQuoter.mockReturnValue(quoter)
      const onQuote = jest.fn()
      const onFailed = jest.fn()

      subscribeToFirstQuote(params, onQuote, onFailed)
      // payload shape differs per event; the util ignores it here
      emit(
        event,
        event === 'error' ? new Error('boom') : { reason: 'no-quotes' }
      )

      expect(onFailed).toHaveBeenCalledTimes(1)
      expect(onQuote).not.toHaveBeenCalled()
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    }
  )

  it('ignores events after the returned cleanup runs, without calling callbacks', () => {
    const { quoter, unsubscribe, emit } = makeQuoter()
    mockGetQuoter.mockReturnValue(quoter)
    const onQuote = jest.fn()
    const onFailed = jest.fn()

    const cleanup = subscribeToFirstQuote(params, onQuote, onFailed)
    cleanup?.()
    // A late event after teardown must not fire either callback.
    emit('quote', { bestQuote, quote: bestQuote, quotes: [bestQuote] })

    expect(unsubscribe).toHaveBeenCalled()
    expect(onQuote).not.toHaveBeenCalled()
    expect(onFailed).not.toHaveBeenCalled()
  })

  it('returns undefined when the quoter cannot be created', () => {
    mockGetQuoter.mockReturnValue(null)
    expect(subscribeToFirstQuote(params, jest.fn(), jest.fn())).toBeUndefined()
  })

  it('returns undefined when getQuoter throws', () => {
    mockGetQuoter.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(subscribeToFirstQuote(params, jest.fn(), jest.fn())).toBeUndefined()
  })
})
