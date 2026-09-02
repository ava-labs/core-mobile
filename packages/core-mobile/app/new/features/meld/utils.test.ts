import { PaymentMethods, ServiceProviderCategories } from './consts'
import { CreateCryptoQuoteErrorCode, Quote } from './types'
import {
  buildDisplayTokenUnit,
  getErrorMessage,
  humanizePaymentMethodName,
  isNoValidQuotesError,
  resolveNoValidQuotesFallback,
  resolveQuoteDestinationAmount,
  resolveQuoteTokenAmount,
  selectQuoteForDisplay,
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
    attemptedPaymentMethods: [] as string[],
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

  it('suggests a different method, not the failing one, for a manual choice', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
        paymentMethodIsManual: true,
        // the unfiltered batch lists the user's own failing method first
        fallbackQuotes: [
          quote({ paymentMethodType: PaymentMethods.BR_BANK_TRANSFER }),
          quote({ paymentMethodType: PaymentMethods.CREDIT_DEBIT_CARD })
        ]
      })
    ).toEqual({
      action: 'error',
      message:
        "Local Manual Bank Transfer isn't available for this purchase. Try Debit/credit card."
    })
  })

  it('falls back to a generic manual message when no different method exists', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
        paymentMethodIsManual: true,
        fallbackQuotes: [
          quote({ paymentMethodType: PaymentMethods.BR_BANK_TRANSFER })
        ]
      })
    ).toEqual({
      action: 'error',
      message:
        "Local Manual Bank Transfer isn't available for this purchase. Try a different payment method."
    })
  })

  it('stops adopting once every quotable method has already been attempted (no infinite loop)', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.APPLE_PAY,
        paymentMethodIsManual: false,
        attemptedPaymentMethods: [
          PaymentMethods.APPLE_PAY,
          PaymentMethods.CREDIT_DEBIT_CARD
        ],
        fallbackQuotes: [
          quote({ paymentMethodType: PaymentMethods.CREDIT_DEBIT_CARD }),
          quote({ paymentMethodType: PaymentMethods.APPLE_PAY })
        ]
      })
    ).toEqual({
      action: 'error',
      message:
        'No payment methods currently support USD purchases in your region. Try changing your currency in settings.'
    })
  })

  it('adopts the first not-yet-attempted method', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.APPLE_PAY,
        paymentMethodIsManual: false,
        attemptedPaymentMethods: [PaymentMethods.APPLE_PAY],
        fallbackQuotes: [
          quote({ paymentMethodType: PaymentMethods.APPLE_PAY }),
          quote({
            paymentMethodType: PaymentMethods.CREDIT_DEBIT_CARD,
            serviceProvider: 'MERCURYO'
          })
        ]
      })
    ).toEqual({
      action: 'adopt',
      paymentMethodType: PaymentMethods.CREDIT_DEBIT_CARD,
      serviceProvider: 'MERCURYO'
    })
  })

  it('adopts a later quotable method when the first quote has no paymentMethodType', () => {
    expect(
      resolveNoValidQuotesFallback({
        ...baseArgs,
        paymentMethod: PaymentMethods.BR_BANK_TRANSFER,
        paymentMethodIsManual: false,
        fallbackQuotes: [
          quote({ paymentMethodType: undefined }),
          quote({
            paymentMethodType: PaymentMethods.CREDIT_DEBIT_CARD,
            serviceProvider: 'MERCURYO'
          })
        ]
      })
    ).toEqual({
      action: 'adopt',
      paymentMethodType: PaymentMethods.CREDIT_DEBIT_CARD,
      serviceProvider: 'MERCURYO'
    })
  })
})

const quoteWithDestinationAmount = (overrides: Partial<Quote> = {}): Quote =>
  ({
    serviceProvider: 'MERCURYO',
    destinationAmount: 17.02,
    ...overrides
  } as Quote)

describe('selectQuoteForDisplay', () => {
  const quote = quoteWithDestinationAmount

  it('returns undefined when there are no quotes', () => {
    expect(selectQuoteForDisplay([], 'MERCURYO')).toBeUndefined()
  })

  it('returns the quote matching the selected service provider', () => {
    const wanted = quote({ serviceProvider: 'TRANSAK', destinationAmount: 18 })
    expect(selectQuoteForDisplay([quote(), wanted], 'TRANSAK')).toEqual(wanted)
  })

  it('falls back to the first (best) quote when no service provider is selected', () => {
    const best = quote({ serviceProvider: 'MERCURYO' })
    expect(
      selectQuoteForDisplay(
        [best, quote({ serviceProvider: 'TRANSAK' })],
        undefined
      )
    ).toEqual(best)
  })

  it('falls back to the first (best) quote when the selected provider did not quote', () => {
    const best = quote({ serviceProvider: 'MERCURYO' })
    expect(selectQuoteForDisplay([best], 'TRANSAK')).toEqual(best)
  })
})

describe('resolveQuoteDestinationAmount', () => {
  const quote = quoteWithDestinationAmount

  const baseArgs = {
    category: ServiceProviderCategories.CRYPTO_ONRAMP,
    displayedAmount: 100,
    sourceAmount: 100,
    isLoadingCryptoQuotes: false,
    crytoQuotes: [quote()] as Quote[],
    serviceProvider: 'MERCURYO' as string | undefined
  }

  it('returns the matching quote destination amount once quotes settle for the displayed amount', () => {
    expect(resolveQuoteDestinationAmount(baseArgs)).toBe(17.02)
  })

  it('is offramp-inert: only applies to CRYPTO_ONRAMP', () => {
    expect(
      resolveQuoteDestinationAmount({
        ...baseArgs,
        category: ServiceProviderCategories.CRYPTO_OFFRAMP
      })
    ).toBeUndefined()
  })

  it('falls back to spot (undefined) while quotes are loading', () => {
    expect(
      resolveQuoteDestinationAmount({
        ...baseArgs,
        isLoadingCryptoQuotes: true
      })
    ).toBeUndefined()
  })

  it('falls back to spot (undefined) when there are no quotes', () => {
    expect(
      resolveQuoteDestinationAmount({ ...baseArgs, crytoQuotes: [] })
    ).toBeUndefined()
  })

  it('falls back to spot (undefined) while the displayed amount has not caught up to the debounced source amount', () => {
    expect(
      resolveQuoteDestinationAmount({ ...baseArgs, displayedAmount: 150 })
    ).toBeUndefined()
  })

  it('falls back to spot (undefined) when sourceAmount is not yet resolved', () => {
    expect(
      resolveQuoteDestinationAmount({ ...baseArgs, sourceAmount: undefined })
    ).toBeUndefined()
  })

  it('falls back to spot (undefined) when the displayed amount is null or undefined', () => {
    expect(
      resolveQuoteDestinationAmount({ ...baseArgs, displayedAmount: null })
    ).toBeUndefined()
    expect(
      resolveQuoteDestinationAmount({ ...baseArgs, displayedAmount: undefined })
    ).toBeUndefined()
  })

  it('uses the best-fee quote when the selected provider has not quoted yet', () => {
    expect(
      resolveQuoteDestinationAmount({
        ...baseArgs,
        serviceProvider: 'TRANSAK',
        crytoQuotes: [
          quote({ serviceProvider: 'MERCURYO', destinationAmount: 17.02 })
        ]
      })
    ).toBe(17.02)
  })

  it('updates to the newly selected provider quote when the batch already contains it', () => {
    expect(
      resolveQuoteDestinationAmount({
        ...baseArgs,
        serviceProvider: 'TRANSAK',
        crytoQuotes: [
          quote({ serviceProvider: 'MERCURYO', destinationAmount: 17.02 }),
          quote({ serviceProvider: 'TRANSAK', destinationAmount: 16.5 })
        ]
      })
    ).toBe(16.5)
  })
})

describe('resolveQuoteTokenAmount', () => {
  const quote = (overrides: Partial<Quote> = {}): Quote =>
    ({
      destinationAmount: 17.02,
      sourceAmount: 100,
      ...overrides
    } as Quote)

  it('uses destinationAmount (net crypto received) for onramp', () => {
    expect(
      resolveQuoteTokenAmount(quote(), ServiceProviderCategories.CRYPTO_ONRAMP)
    ).toBe(17.02)
  })

  it('uses sourceAmount (crypto sold) for offramp', () => {
    expect(
      resolveQuoteTokenAmount(quote(), ServiceProviderCategories.CRYPTO_OFFRAMP)
    ).toBe(100)
  })

  it('does not subtract totalFee/exchangeRate on top of the already fee-inclusive amount', () => {
    // Regression guard: totalFee is a source-currency disclosure of the
    // spread already priced into exchangeRate, not a separate deduction.
    expect(
      resolveQuoteTokenAmount(
        quote({ totalFee: 5, exchangeRate: 2 }),
        ServiceProviderCategories.CRYPTO_ONRAMP
      )
    ).toBe(17.02)
  })

  it('defaults to 0 when the relevant amount is missing', () => {
    expect(
      resolveQuoteTokenAmount(
        quote({ destinationAmount: null, sourceAmount: null }),
        ServiceProviderCategories.CRYPTO_ONRAMP
      )
    ).toBe(0)
    expect(
      resolveQuoteTokenAmount(
        quote({ destinationAmount: null, sourceAmount: null }),
        ServiceProviderCategories.CRYPTO_OFFRAMP
      )
    ).toBe(0)
  })
})

describe('buildDisplayTokenUnit', () => {
  it('displays a quote destinationAmount unchanged through a 6-decimal token (e.g. USDT)', () => {
    const tokenUnit = buildDisplayTokenUnit(17.02, 6, 'USDT')
    expect(tokenUnit.toDisplay({ asNumber: true })).toBe(17.02)
  })

  it('displays a quote destinationAmount unchanged through an 18-decimal token (e.g. WETH)', () => {
    const tokenUnit = buildDisplayTokenUnit(17.02, 18, 'WETH')
    expect(tokenUnit.toDisplay({ asNumber: true })).toBe(17.02)
  })
})
