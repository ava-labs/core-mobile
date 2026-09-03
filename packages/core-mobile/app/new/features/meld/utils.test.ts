import { PaymentMethods } from './consts'
import { CreateCryptoQuoteErrorCode, Quote } from './types'
import {
  getErrorMessage,
  humanizePaymentMethodName,
  isNoValidQuotesError,
  resolveNoValidQuotesFallback,
  shouldRetryCryptoQuote
} from './utils'

describe('getErrorMessage', () => {
  it('returns message-only API errors with the HTTP status', () => {
    const error = Object.assign(new Error('Request failed'), {
      response: {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'No valid quotes found' }
      }
    })

    expect(getErrorMessage(error)).toEqual({
      statusCode: CreateCryptoQuoteErrorCode.BAD_REQUEST,
      message: 'No valid quotes found'
    })
  })
})

describe('isNoValidQuotesError', () => {
  it('matches the message-only 400 Meld returns for NO_VALID_QUOTES', () => {
    expect(
      isNoValidQuotesError({
        statusCode: CreateCryptoQuoteErrorCode.BAD_REQUEST,
        message: 'No Valid Quote Combinations Found For Provided Quote Request.'
      })
    ).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(
      isNoValidQuotesError({
        statusCode: CreateCryptoQuoteErrorCode.BAD_REQUEST,
        message: 'no valid quote combinations found for provided quote request.'
      })
    ).toBe(true)
  })

  it('rejects a 400 with an unrelated message', () => {
    expect(
      isNoValidQuotesError({
        statusCode: CreateCryptoQuoteErrorCode.BAD_REQUEST,
        message: 'Some other validation failure'
      })
    ).toBe(false)
  })

  it('rejects a matching message on a non-400 status code', () => {
    expect(
      isNoValidQuotesError({
        statusCode: CreateCryptoQuoteErrorCode.INCOMPATIBLE_REQUEST,
        message: 'No Valid Quote Combinations Found For Provided Quote Request.'
      })
    ).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isNoValidQuotesError(undefined)).toBe(false)
  })
})

describe('humanizePaymentMethodName', () => {
  it('uses the known display name when one exists', () => {
    expect(humanizePaymentMethodName(PaymentMethods.CREDIT_DEBIT_CARD)).toBe(
      'Debit/credit card'
    )
  })

  it('humanizes an unknown payment method', () => {
    // matches lodash startCase's actual behavior for all-caps input: it
    // splits on underscores but doesn't re-case letters that are already
    // capitalized, so an all-caps method name stays all-caps per word.
    expect(humanizePaymentMethodName('SOME_NEW_METHOD')).toBe('SOME NEW METHOD')
  })

  it('returns undefined for empty input', () => {
    expect(humanizePaymentMethodName(undefined)).toBeUndefined()
    expect(humanizePaymentMethodName(null)).toBeUndefined()
  })
})

describe('shouldRetryCryptoQuote', () => {
  const errorWithStatus = (statusCode: number): Error =>
    Object.assign(new Error('Request failed'), {
      response: { status: statusCode, statusText: '', data: undefined }
    })

  it('retries a 5xx while under the failure-count cap', () => {
    expect(shouldRetryCryptoQuote(0, errorWithStatus(500))).toBe(true)
    expect(shouldRetryCryptoQuote(2, errorWithStatus(500))).toBe(true)
  })

  it('stops retrying a 5xx once the cap is reached', () => {
    expect(shouldRetryCryptoQuote(3, errorWithStatus(500))).toBe(false)
  })

  it('never retries a 4xx, since the request params will not change', () => {
    expect(shouldRetryCryptoQuote(0, errorWithStatus(400))).toBe(false)
  })

  it('never retries a Meld string error code (deterministic, not a network error)', () => {
    const errorWithCode = Object.assign(new Error('Request failed'), {
      response: {
        data: {
          code: CreateCryptoQuoteErrorCode.INCOMPATIBLE_REQUEST,
          message: 'Incompatible request'
        }
      }
    })
    expect(shouldRetryCryptoQuote(0, errorWithCode)).toBe(false)
  })

  it('retries a network error (no response, no resolvable status code) while under the cap', () => {
    expect(shouldRetryCryptoQuote(0, new Error('network down'))).toBe(true)
    expect(shouldRetryCryptoQuote(2, new Error('network down'))).toBe(true)
  })

  it('stops retrying a network error once the cap is reached', () => {
    expect(shouldRetryCryptoQuote(3, new Error('network down'))).toBe(false)
  })
})

describe('resolveNoValidQuotesFallback', () => {
  const quote = (overrides: Partial<Quote> = {}): Quote =>
    ({
      paymentMethodType: PaymentMethods.APPLE_PAY,
      serviceProvider: 'MERCURYO',
      ...overrides
    } as Quote)

  const baseArgs = {
    isNoValidQuotesError: true,
    paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
    paymentMethodIsManual: false,
    isLoadingFallbackQuotes: false,
    fallbackQuotes: [] as Quote[],
    selectedCurrency: 'USD'
  }

  it('does nothing when there is no NO_VALID_QUOTES error', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        isNoValidQuotesError: false,
        fallbackQuotes: [quote()]
      })
    ).toEqual({ action: 'none' })
  })

  it('does nothing when no payment method is selected', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: undefined,
        fallbackQuotes: [quote()]
      })
    ).toEqual({ action: 'none' })
  })

  it('does nothing while the fallback request is still in flight', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        isLoadingFallbackQuotes: true,
        fallbackQuotes: [quote()]
      })
    ).toEqual({ action: 'none' })
  })

  it('reports no regional support when the fallback also comes back empty', () => {
    expect(
      resolveNoValidQuotesFallback({ ...baseArgs, fallbackQuotes: [] })
    ).toEqual({
      action: 'error',
      message:
        'No payment methods currently support USD purchases in your region. Try changing your currency in settings.'
    })
  })

  it('silently adopts the best fallback quote for an auto-defaulted payment method', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethodIsManual: false,
        fallbackQuotes: [
          quote({
            paymentMethodType: PaymentMethods.APPLE_PAY,
            serviceProvider: 'MERCURYO'
          })
        ]
      })
    ).toEqual({
      action: 'adopt',
      paymentMethodType: PaymentMethods.APPLE_PAY,
      serviceProvider: 'MERCURYO'
    })
  })

  it('skips a fallback quote that repeats the already-failing payment method', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
        paymentMethodIsManual: false,
        fallbackQuotes: [
          quote({
            paymentMethodType: PaymentMethods.BR_BANK_TRANSFER,
            serviceProvider: 'SAME_METHOD_PROVIDER'
          }),
          quote({
            paymentMethodType: PaymentMethods.APPLE_PAY,
            serviceProvider: 'MERCURYO'
          })
        ]
      })
    ).toEqual({
      action: 'adopt',
      paymentMethodType: PaymentMethods.APPLE_PAY,
      serviceProvider: 'MERCURYO'
    })
  })

  it('reports no regional support when every fallback quote repeats the failing method', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
        paymentMethodIsManual: false,
        fallbackQuotes: [
          quote({
            paymentMethodType: PaymentMethods.BR_BANK_TRANSFER,
            serviceProvider: 'PROVIDER_A'
          }),
          quote({
            paymentMethodType: PaymentMethods.BR_BANK_TRANSFER,
            serviceProvider: 'PROVIDER_B'
          })
        ]
      })
    ).toEqual({
      action: 'error',
      message:
        'No payment methods currently support USD purchases in your region. Try changing your currency in settings.'
    })
  })

  it('surfaces a switch-method message instead of overriding a manual choice', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
        paymentMethodIsManual: true,
        fallbackQuotes: [quote({ paymentMethodType: PaymentMethods.APPLE_PAY })]
      })
    ).toEqual({
      action: 'error',
      message:
        "Local Manual Bank Transfer isn't available for this purchase. Try Apple Pay."
    })
  })
})
