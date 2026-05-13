import type { Quote } from '../types'
import {
  getFingerprintForFeeEstimationError,
  isQuoteUsable,
  isUserStateError
} from './useFeeEstimation.helpers'

describe('isQuoteUsable', () => {
  const buildQuote = (expiresAt: number): Quote => ({ expiresAt } as Quote)

  it('returns true when expiresAt is comfortably in the future', () => {
    const future = Math.floor(Date.now() / 1000) + 60
    expect(isQuoteUsable(buildQuote(future))).toBe(true)
  })

  it('returns false when expiresAt has already passed', () => {
    const past = Math.floor(Date.now() / 1000) - 60
    expect(isQuoteUsable(buildQuote(past))).toBe(false)
  })

  it('returns false when expiresAt equals current second (matches SDK throw condition `<=`)', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(isQuoteUsable(buildQuote(now))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isQuoteUsable(null)).toBe(false)
  })

  it('returns false when expiresAt is 0 (epoch — long past)', () => {
    expect(isQuoteUsable(buildQuote(0))).toBe(false)
  })

  it('returns false when expiresAt is negative', () => {
    expect(isQuoteUsable(buildQuote(-1))).toBe(false)
  })

  it('returns false when expiresAt is NaN', () => {
    expect(isQuoteUsable(buildQuote(Number.NaN))).toBe(false)
  })
})

describe('getFingerprintForFeeEstimationError', () => {
  it('returns details.data when present', () => {
    const error = { details: { data: '0xeda86850' } } // TargetCallFailed
    expect(getFingerprintForFeeEstimationError(error)).toEqual([
      'useFeeEstimation',
      '0xeda86850'
    ])
  })

  it('falls back to default grouping when details is missing', () => {
    expect(getFingerprintForFeeEstimationError({})).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when details.data is missing', () => {
    expect(getFingerprintForFeeEstimationError({ details: {} })).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when details is null', () => {
    expect(getFingerprintForFeeEstimationError({ details: null })).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when details.data is not a string', () => {
    expect(
      getFingerprintForFeeEstimationError({ details: { data: 1234 } })
    ).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when error is null', () => {
    expect(getFingerprintForFeeEstimationError(null)).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when error is a primitive', () => {
    expect(getFingerprintForFeeEstimationError('oops')).toEqual([
      '{{ default }}'
    ])
  })
})

describe('isUserStateError', () => {
  it('matches raw RPC -32000 insufficient funds', () => {
    const error = {
      code: -32000,
      message:
        'failed with 40000000 gas: insufficient funds for gas * price + value: address 0x... have 0 want 1000'
    }
    expect(isUserStateError(error)).toBe(true)
  })

  it('matches wrapped SDK error via causedByInsufficientFunds', () => {
    const error = {
      causedByInsufficientFunds: () => true
    }
    expect(isUserStateError(error)).toBe(true)
  })

  it('matches transfer amount exceeds balance via details.cause.shortMessage', () => {
    const error = {
      details: {
        cause: { shortMessage: 'ERC20: transfer amount exceeds balance' }
      }
    }
    expect(isUserStateError(error)).toBe(true)
  })

  it('matches transfer amount exceeds allowance', () => {
    const error = {
      details: {
        cause: { shortMessage: 'ERC20: transfer amount exceeds allowance' }
      }
    }
    expect(isUserStateError(error)).toBe(true)
  })

  it('matches WAVAX unwrap burn balance', () => {
    const error = {
      details: {
        cause: { shortMessage: 'ERC20: burn amount exceeds balance' }
      }
    }
    expect(isUserStateError(error)).toBe(true)
  })

  it('does NOT match TargetCallFailed (the 5006 SDK family)', () => {
    const error = {
      details: {
        data: '0xeda86850',
        cause: { shortMessage: 'Execution reverted: TargetCallFailed()' }
      }
    }
    expect(isUserStateError(error)).toBe(false)
  })

  it('does NOT match Panic(17) reverts', () => {
    const error = {
      details: {
        cause: { shortMessage: 'Panic(17)' }
      }
    }
    expect(isUserStateError(error)).toBe(false)
  })

  it('does NOT match UnsupportedTokenOut', () => {
    const error = {
      details: {
        cause: { shortMessage: 'Execution reverted: UnsupportedTokenOut()' }
      }
    }
    expect(isUserStateError(error)).toBe(false)
  })

  it('does NOT match unknown errors (fail open, capture by default)', () => {
    expect(isUserStateError(new Error('something unexpected'))).toBe(false)
  })

  it('does NOT match QUOTE_EXPIRED (different fix path)', () => {
    const error = {
      name: 'InvalidParamsError',
      message: 'Quote expired 5 seconds ago.'
    }
    expect(isUserStateError(error)).toBe(false)
  })

  it('does NOT match null', () => {
    expect(isUserStateError(null)).toBe(false)
  })

  it('does NOT match a primitive', () => {
    expect(isUserStateError('oops')).toBe(false)
  })

  it('does NOT match -32000 without insufficient funds in message', () => {
    expect(
      isUserStateError({ code: -32000, message: 'some other failure' })
    ).toBe(false)
  })

  it('matches string-coded -32000 (some RPC providers emit code as a string)', () => {
    const error = {
      code: '-32000',
      message: 'insufficient funds for gas * price + value'
    }
    expect(isUserStateError(error)).toBe(true)
  })

  it('does not throw when code is a symbol (Number(symbol) would throw)', () => {
    const error = {
      code: Symbol('-32000'),
      message: 'insufficient funds for gas * price + value'
    }
    expect(() => isUserStateError(error)).not.toThrow()
    expect(isUserStateError(error)).toBe(false)
  })

  it('falls through when causedByInsufficientFunds throws', () => {
    const error = {
      causedByInsufficientFunds: () => {
        throw new Error('boom')
      }
    }
    // Should NOT crash and should NOT silently match — fall through to other
    // matchers; with no other match it returns false so caller still captures.
    expect(() => isUserStateError(error)).not.toThrow()
    expect(isUserStateError(error)).toBe(false)
  })
})
