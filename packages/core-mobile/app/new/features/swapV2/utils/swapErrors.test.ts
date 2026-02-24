import {
  isUserRejectionError,
  isGasEstimationError,
  isInvalidResponseError,
  shouldRetryWithNextQuote,
  getSwapErrorMessage
} from './swapErrors'

describe('isUserRejectionError', () => {
  it('should return true for "user rejected" message', () => {
    expect(isUserRejectionError(new Error('user rejected'))).toBe(true)
  })

  it('should be case-insensitive', () => {
    expect(isUserRejectionError(new Error('User Rejected'))).toBe(true)
    expect(isUserRejectionError(new Error('USER REJECTED'))).toBe(true)
    expect(isUserRejectionError(new Error('User Rejected the request'))).toBe(
      true
    )
  })

  it('should return false for unrelated errors', () => {
    expect(isUserRejectionError(new Error('insufficient funds'))).toBe(false)
    expect(isUserRejectionError(new Error('gas estimation failed'))).toBe(false)
    expect(isUserRejectionError(new Error(''))).toBe(false)
  })

  it('should return false for non-Error values', () => {
    expect(isUserRejectionError('user rejected')).toBe(false)
    expect(isUserRejectionError({ message: 'user rejected' })).toBe(false)
    expect(isUserRejectionError(null)).toBe(false)
    expect(isUserRejectionError(undefined)).toBe(false)
    expect(isUserRejectionError(42)).toBe(false)
  })
})

describe('isGasEstimationError', () => {
  it('should return true for "gas estimation" message', () => {
    expect(isGasEstimationError(new Error('gas estimation failed'))).toBe(true)
    expect(isGasEstimationError(new Error('gas estimation error'))).toBe(true)
  })

  it('should be case-insensitive', () => {
    expect(isGasEstimationError(new Error('Gas Estimation Failed'))).toBe(true)
    expect(isGasEstimationError(new Error('GAS ESTIMATION'))).toBe(true)
  })

  it('should return false for unrelated errors', () => {
    expect(isGasEstimationError(new Error('insufficient funds'))).toBe(false)
    expect(isGasEstimationError(new Error('user rejected'))).toBe(false)
    expect(isGasEstimationError(new Error(''))).toBe(false)
  })

  it('should return false for non-Error values', () => {
    expect(isGasEstimationError('gas estimation')).toBe(false)
    expect(isGasEstimationError(null)).toBe(false)
    expect(isGasEstimationError(undefined)).toBe(false)
  })
})

describe('isInvalidResponseError', () => {
  it('should return true for "invalid response" message', () => {
    expect(
      isInvalidResponseError(new Error('invalid response from server'))
    ).toBe(true)
    expect(isInvalidResponseError(new Error('invalid response'))).toBe(true)
  })

  it('should return true for "response validation failed" message', () => {
    expect(
      isInvalidResponseError(new Error('response validation failed'))
    ).toBe(true)
    expect(
      isInvalidResponseError(
        new Error('response validation failed: missing field')
      )
    ).toBe(true)
  })

  it('should be case-insensitive', () => {
    expect(isInvalidResponseError(new Error('Invalid Response'))).toBe(true)
    expect(
      isInvalidResponseError(new Error('Response Validation Failed'))
    ).toBe(true)
  })

  it('should return false for unrelated errors', () => {
    expect(isInvalidResponseError(new Error('insufficient funds'))).toBe(false)
    expect(isInvalidResponseError(new Error('user rejected'))).toBe(false)
    expect(isInvalidResponseError(new Error(''))).toBe(false)
  })

  it('should return false for non-Error values', () => {
    expect(isInvalidResponseError('invalid response')).toBe(false)
    expect(isInvalidResponseError(null)).toBe(false)
    expect(isInvalidResponseError(undefined)).toBe(false)
  })
})

describe('shouldRetryWithNextQuote', () => {
  it('should return true for gas estimation errors', () => {
    expect(shouldRetryWithNextQuote(new Error('gas estimation failed'))).toBe(
      true
    )
  })

  it('should return true for invalid response errors', () => {
    expect(
      shouldRetryWithNextQuote(new Error('invalid response from aggregator'))
    ).toBe(true)
    expect(
      shouldRetryWithNextQuote(new Error('response validation failed'))
    ).toBe(true)
  })

  it('should return false for user rejection errors', () => {
    expect(shouldRetryWithNextQuote(new Error('user rejected'))).toBe(false)
  })

  it('should return false for unrelated errors', () => {
    expect(shouldRetryWithNextQuote(new Error('insufficient funds'))).toBe(
      false
    )
    expect(shouldRetryWithNextQuote(new Error('network timeout'))).toBe(false)
    expect(shouldRetryWithNextQuote(new Error(''))).toBe(false)
  })

  it('should return false for non-Error values', () => {
    expect(shouldRetryWithNextQuote(null)).toBe(false)
    expect(shouldRetryWithNextQuote(undefined)).toBe(false)
    expect(shouldRetryWithNextQuote('gas estimation')).toBe(false)
  })
})

describe('getSwapErrorMessage', () => {
  it('should return insufficient balance message for insufficient funds errors', () => {
    expect(getSwapErrorMessage(new Error('insufficient funds for gas'))).toBe(
      'Insufficient balance to complete swap and cover gas fees'
    )
    expect(getSwapErrorMessage(new Error('insufficient funds'))).toBe(
      'Insufficient balance to complete swap and cover gas fees'
    )
  })

  it('should return slippage message for slippage errors', () => {
    expect(getSwapErrorMessage(new Error('slippage tolerance exceeded'))).toBe(
      'Price moved too much. Try increasing slippage tolerance.'
    )
    expect(getSwapErrorMessage(new Error('slippage'))).toBe(
      'Price moved too much. Try increasing slippage tolerance.'
    )
  })

  it('should return expiry message for expired errors', () => {
    expect(getSwapErrorMessage(new Error('quote expired'))).toBe(
      'Quote expired. Please try again.'
    )
    expect(getSwapErrorMessage(new Error('expired'))).toBe(
      'Quote expired. Please try again.'
    )
  })

  it('should return gas message for gas estimation errors', () => {
    expect(getSwapErrorMessage(new Error('gas estimation failed'))).toBe(
      'Unable to estimate gas. The swap may fail.'
    )
  })

  it('should return original message for unrecognized errors', () => {
    expect(getSwapErrorMessage(new Error('something unexpected'))).toBe(
      'something unexpected'
    )
    expect(getSwapErrorMessage(new Error('network timeout'))).toBe(
      'network timeout'
    )
  })

  it('should return unknown error message for non-Error values', () => {
    expect(getSwapErrorMessage(null)).toBe('Unknown error occurred')
    expect(getSwapErrorMessage(undefined)).toBe('Unknown error occurred')
    expect(getSwapErrorMessage('a plain string')).toBe('Unknown error occurred')
    expect(getSwapErrorMessage(42)).toBe('Unknown error occurred')
    expect(getSwapErrorMessage({ message: 'object error' })).toBe(
      'Unknown error occurred'
    )
  })
})
