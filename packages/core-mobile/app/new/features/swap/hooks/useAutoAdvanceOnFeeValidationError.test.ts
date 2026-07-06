import { renderHook } from '@testing-library/react-hooks'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import type { Quote } from '../types'
import { FusionQuoteError, fusionErrors } from '../utils/fusionErrors'
import { useAutoAdvanceOnFeeValidationError } from './useAutoAdvanceOnFeeValidationError'

jest.mock('common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

const mockShowSnackbar = jest.mocked(showSnackbar)
const mockLoggerError = jest.mocked(Logger.error)

const makeQuote = (id: string, aggregatorName = id): Quote =>
  ({ id, aggregator: { name: aggregatorName } } as unknown as Quote)

const providerSpecificError = (): FusionQuoteError =>
  fusionErrors.insufficientFundsForFee(undefined)
const balanceError = (): FusionQuoteError =>
  fusionErrors.networkFeeExceedsBalance('0.001 AVAX')
const warningError = (): FusionQuoteError => fusionErrors.gasEstimationFailed()

const DEFAULT_MAX = 3

type HookProps = Parameters<typeof useAutoAdvanceOnFeeValidationError>[0]

const props = (overrides: Partial<HookProps> = {}): HookProps => ({
  feeValidationError: undefined,
  isValidating: false,
  isSwapping: false,
  activeQuote: null,
  allQuotes: [],
  userQuote: null,
  advanceBestQuote: jest.fn(),
  maxAdvances: DEFAULT_MAX,
  ...overrides
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAutoAdvanceOnFeeValidationError', () => {
  it('advances to the next quote when the error is provider-specific', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).toHaveBeenCalledWith('b')
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1)
  })

  it('logs the advance via Logger.error for Sentry reporting', () => {
    const quotes = [
      makeQuote('a', 'Markr'),
      makeQuote('b', 'DeBridge'),
      makeQuote('c')
    ]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(mockLoggerError).toHaveBeenCalledTimes(1)
    const [message, context] = mockLoggerError.mock.calls[0] ?? []
    expect(message).toContain('auto-advanc')
    expect(context).toMatchObject({
      failed: 'Markr',
      retrying: 'DeBridge',
      attempt: 1,
      maxAdvances: DEFAULT_MAX
    })
  })

  it('does nothing when the user has manually picked a quote', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          userQuote: quotes[0] as Quote,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when the error is undefined', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  it('does nothing for balance-threshold errors', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: balanceError(),
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing for warning errors (Next already enabled)', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: warningError(),
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when the active quote is already the last one', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          activeQuote: quotes[1] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when the active quote is not present in allQuotes', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          activeQuote: makeQuote('stale'),
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when activeQuote is null', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          activeQuote: null,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('advances only once per error occurrence', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      }
    )

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        advanceBestQuote
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(1)
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1)
  })

  it('stops advancing once maxAdvances is reached', () => {
    const quotes = [
      makeQuote('a'),
      makeQuote('b'),
      makeQuote('c'),
      makeQuote('d'),
      makeQuote('e')
    ]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote,
          maxAdvances: 3
        })
      }
    )
    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 3
      })
    )
    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[2] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 3
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(3)

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[3] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 3
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(3)
  })

  it('resets the advance counter when the error clears', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote,
          maxAdvances: 1
        })
      }
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(1)
    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 1
      })
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(1)

    // Stable clear: error gone AND not validating → counter resets
    rerender(
      props({
        feeValidationError: undefined,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 1
      })
    )

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 1
      })
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(2)
    expect(advanceBestQuote).toHaveBeenLastCalledWith('c')
  })

  it('does NOT reset the counter while validation is in flight', () => {
    // Regression: every quote-stream refresh briefly sets feeValidationError
    // to undefined while React Query refetches. Resetting on that transient
    // gap re-armed the budget on each cycle and let the hook walk the whole
    // list every few seconds — the JS-thread churn behind the freeze.
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote,
          maxAdvances: 1
        })
      }
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(1)

    // Mid-flight: error is undefined ONLY because React Query is refetching.
    // Counter must hold.
    rerender(
      props({
        feeValidationError: undefined,
        isValidating: true,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 1
      })
    )

    // New provider-specific error — budget already spent, must NOT advance.
    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 1
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(1)
  })

  it('does not advance while a swap is in flight', () => {
    // Once the user has pressed Next, SwapContext.swap() captured a quote and
    // is awaiting transferAsset. Changing activeQuote underneath that call
    // would race the in-flight transfer and spam Zustand updates while the
    // JS thread is already busy.
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError(
        props({
          feeValidationError: providerSpecificError(),
          isSwapping: true,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      )
    )

    expect(advanceBestQuote).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  it('resumes advancing once the swap is no longer in flight', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          isSwapping: true,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      }
    )
    expect(advanceBestQuote).not.toHaveBeenCalled()

    rerender(
      props({
        feeValidationError: error,
        isSwapping: false,
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        advanceBestQuote
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledWith('b')
  })

  it('does not advance twice from the same quote when allQuotes identity changes but contents do not', () => {
    // Reviewer scenario: stream pushes a fresh allQuotes array with the same
    // contents. activeQuote.id is unchanged. We must not advance again.
    const quotesV1 = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const quotesV2 = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotesV1[0] as Quote,
          allQuotes: quotesV1,
          advanceBestQuote
        })
      }
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(1)

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotesV1[0] as Quote,
        allQuotes: quotesV2,
        advanceBestQuote
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(1)
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1)
  })

  it('advances again once activeQuote has moved on', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote
        })
      }
    )
    expect(advanceBestQuote).toHaveBeenCalledWith('b')

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        advanceBestQuote
      })
    )

    expect(advanceBestQuote).toHaveBeenCalledTimes(2)
    expect(advanceBestQuote).toHaveBeenLastCalledWith('c')
  })

  it('resets the advance counter when the user takes manual control', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const advanceBestQuote = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      p => useAutoAdvanceOnFeeValidationError(p),
      {
        initialProps: props({
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          advanceBestQuote,
          maxAdvances: 1
        })
      }
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(1)

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[2] as Quote,
        allQuotes: quotes,
        userQuote: quotes[2] as Quote,
        advanceBestQuote,
        maxAdvances: 1
      })
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(1)

    rerender(
      props({
        feeValidationError: error,
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        advanceBestQuote,
        maxAdvances: 1
      })
    )
    expect(advanceBestQuote).toHaveBeenCalledTimes(2)
  })
})
