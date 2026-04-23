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

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAutoAdvanceOnFeeValidationError', () => {
  it('advances to the next quote when the error is provider-specific', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: providerSpecificError(),
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).toHaveBeenCalledWith('b')
    expect(mockShowSnackbar).toHaveBeenCalledTimes(1)
  })

  it('logs the advance via Logger.error for Sentry reporting', () => {
    const quotes = [
      makeQuote('a', 'Markr'),
      makeQuote('b', 'DeBridge'),
      makeQuote('c')
    ]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: providerSpecificError(),
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
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

  it('does nothing when the error is undefined', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: undefined,
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  it('does nothing for balance-threshold errors', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: balanceError(),
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing for warning errors (Next already enabled)', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: warningError(),
        activeQuote: quotes[0] as Quote,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when the active quote is already the last one', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: providerSpecificError(),
        activeQuote: quotes[1] as Quote,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when the active quote is not present in allQuotes', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: providerSpecificError(),
        activeQuote: makeQuote('stale'),
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('does nothing when activeQuote is null', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    const selectQuoteById = jest.fn()

    renderHook(() =>
      useAutoAdvanceOnFeeValidationError({
        feeValidationError: providerSpecificError(),
        activeQuote: null,
        allQuotes: quotes,
        selectQuoteById,
        maxAdvances: DEFAULT_MAX
      })
    )

    expect(selectQuoteById).not.toHaveBeenCalled()
    expect(mockShowSnackbar).not.toHaveBeenCalled()
  })

  it('advances only once per error occurrence', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const selectQuoteById = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      props => useAutoAdvanceOnFeeValidationError(props),
      {
        initialProps: {
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          selectQuoteById,
          maxAdvances: DEFAULT_MAX
        }
      }
    )

    // Re-render with same inputs should not trigger another advance
    rerender({
      feeValidationError: error,
      activeQuote: quotes[0] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: DEFAULT_MAX
    })

    expect(selectQuoteById).toHaveBeenCalledTimes(1)
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
    const selectQuoteById = jest.fn()
    const error = providerSpecificError()

    // Simulate: advance from a → b → c → d (3 advances = maxAdvances)
    const { rerender } = renderHook(
      props => useAutoAdvanceOnFeeValidationError(props),
      {
        initialProps: {
          feeValidationError: error,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          selectQuoteById,
          maxAdvances: 3
        }
      }
    )
    rerender({
      feeValidationError: error,
      activeQuote: quotes[1] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: 3
    })
    rerender({
      feeValidationError: error,
      activeQuote: quotes[2] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: 3
    })

    expect(selectQuoteById).toHaveBeenCalledTimes(3)

    // Fourth attempt — should stop
    rerender({
      feeValidationError: error,
      activeQuote: quotes[3] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: 3
    })

    expect(selectQuoteById).toHaveBeenCalledTimes(3)
  })

  it('resets the advance counter when the error clears', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    const selectQuoteById = jest.fn()
    const error = providerSpecificError()

    const { rerender } = renderHook(
      props => useAutoAdvanceOnFeeValidationError(props),
      {
        initialProps: {
          feeValidationError: error as FusionQuoteError | undefined,
          activeQuote: quotes[0] as Quote,
          allQuotes: quotes,
          selectQuoteById,
          maxAdvances: 1
        }
      }
    )

    // 1 advance, then hit the cap
    expect(selectQuoteById).toHaveBeenCalledTimes(1)
    rerender({
      feeValidationError: error,
      activeQuote: quotes[1] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: 1
    })
    expect(selectQuoteById).toHaveBeenCalledTimes(1)

    // Error clears (e.g. user fixed input) — counter resets
    rerender({
      feeValidationError: undefined,
      activeQuote: quotes[1] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: 1
    })

    // New provider-specific error — should advance again (counter was reset)
    rerender({
      feeValidationError: error,
      activeQuote: quotes[1] as Quote,
      allQuotes: quotes,
      selectQuoteById,
      maxAdvances: 1
    })
    expect(selectQuoteById).toHaveBeenCalledTimes(2)
    expect(selectQuoteById).toHaveBeenLastCalledWith('c')
  })
})
