import { EstimateNativeFeeError, ErrorCode } from '@avalabs/fusion-sdk'
import {
  fusionErrors,
  isGasOnlyNetworkFeeError,
  isUserRejectionError,
  isGasEstimationError,
  isInvalidResponseError,
  shouldRetryWithNextQuote,
  getSwapErrorMessage
} from './fusionErrors'

describe('fusionErrors', () => {
  describe('networkFeeExceedsBalance', () => {
    it('should include required fee in message', () => {
      const error = fusionErrors.networkFeeExceedsBalance('0.001 AVAX')
      expect(error.message).toBe(
        'Network fee exceeds your balance.\nNetwork fee: 0.001 AVAX'
      )
    })
  })

  describe('amountExceedsBalanceAfterNetworkFee', () => {
    it('should include required fee in message', () => {
      const error =
        fusionErrors.amountExceedsBalanceAfterNetworkFee('0.001 AVAX')
      expect(error.message).toBe(
        'Insufficient balance to cover the swap amount and network fee.\nNetwork fee: 0.001 AVAX'
      )
    })
  })

  describe('feesExceedBalance', () => {
    it('should include required fees in message', () => {
      const error = fusionErrors.feesExceedBalance('0.001234 AVAX')
      expect(error.message).toBe(
        'Network and bridge fees exceed your balance.\nRequired fees: 0.001234 AVAX'
      )
    })
  })

  describe('amountExceedsBalanceAfterFees', () => {
    it('should include required fees in message', () => {
      const error = fusionErrors.amountExceedsBalanceAfterFees('0.001234 AVAX')
      expect(error.message).toBe(
        'Insufficient balance to cover the swap amount and fees.\nRequired fees: 0.001234 AVAX'
      )
    })
  })

  describe('networkFeeExceedsNativeBalance', () => {
    it('should include symbol and formatted amount in message', () => {
      const error = fusionErrors.networkFeeExceedsNativeBalance(
        'AVAX',
        '0.001 AVAX'
      )
      expect(error.message).toBe(
        'Network fee exceeds your AVAX balance.\nNetwork fee: 0.001 AVAX.'
      )
    })
  })

  describe('feesExceedNativeBalance', () => {
    it('should include symbol and formatted amount in message', () => {
      const error = fusionErrors.feesExceedNativeBalance('ETH', '0.002 ETH')
      expect(error.message).toBe(
        'Network and bridge fees exceed your ETH balance.\nRequired fees: 0.002 ETH.'
      )
    })

    it('should fall back gracefully for unknown native tokens', () => {
      const error = fusionErrors.feesExceedNativeBalance('native', '1000000')
      expect(error.message).toContain(
        'Network and bridge fees exceed your native balance.'
      )
    })
  })

  describe('bridgeFeeExceedsBalance', () => {
    it('should include required fee in message', () => {
      const error = fusionErrors.bridgeFeeExceedsBalance('0.5 USDC')
      expect(error.message).toBe(
        'Bridge fee exceeds your balance.\nBridge fee: 0.5 USDC'
      )
    })
  })

  describe('amountExceedsBalanceAfterBridgeFee', () => {
    it('should include bridge fee in message', () => {
      const error = fusionErrors.amountExceedsBalanceAfterBridgeFee('0.5 USDC')
      expect(error.message).toBe(
        'Insufficient balance to cover the swap amount and bridge fee.\nBridge fee: 0.5 USDC'
      )
    })
  })

  describe('swapAmountTooSmall', () => {
    it('should return a user-friendly message', () => {
      const error = fusionErrors.swapAmountTooSmall()
      expect(error.message).toBe(
        'Swap amount is too small for this token pair.\nTry a larger amount.'
      )
    })

    it('should be tagged as provider-specific', () => {
      const error = fusionErrors.swapAmountTooSmall()
      expect(error.kind).toBe('provider-specific')
    })
  })

  describe('insufficientFundsForFee', () => {
    it('tags the undefined cause branch as provider-specific', () => {
      const error = fusionErrors.insufficientFundsForFee(undefined)
      expect(error.kind).toBe('provider-specific')
    })

    it('keeps the confirmed-native branch as network-fee-only', () => {
      const error = fusionErrors.insufficientFundsForFee(true)
      expect(error.kind).toBe('network-fee-only')
    })

    it('keeps the confirmed-token branch as other', () => {
      const error = fusionErrors.insufficientFundsForFee(false)
      expect(error.kind).toBe('other')
    })
  })
})

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
  it('should return true for legacy "gas estimation" message (pre-0.15.0 SDK)', () => {
    expect(isGasEstimationError(new Error('gas estimation failed'))).toBe(true)
    expect(isGasEstimationError(new Error('gas estimation error'))).toBe(true)
  })

  it('should return true for post-0.15.0 "estimate gas" messages', () => {
    expect(
      isGasEstimationError(
        new Error('Failed to estimate gas for Markr swap transaction.')
      )
    ).toBe(true)
    expect(
      isGasEstimationError(
        new Error(
          'Failed to estimate gas for Markr swap transaction. Revert: TargetCallFailed().'
        )
      )
    ).toBe(true)
    expect(
      isGasEstimationError(
        new Error('Failed to estimate gas for ERC20 approval transaction.')
      )
    ).toBe(true)
  })

  it('should return true for real SDK EstimateNativeFeeError instances via the type guard', () => {
    // Real SDK instance — the type guard uses instanceof and matches this.
    const err = new EstimateNativeFeeError({
      errorCode: ErrorCode.VIEM_ERROR,
      tx: '0xtx'
    })
    expect(isGasEstimationError(err)).toBe(true)
  })

  it('should return false for duck-typed EstimateNativeFeeError without a matching substring', () => {
    // The SDK's isEstimateNativeFeeError uses instanceof on its own class,
    // so an error that merely has the same `name` property is not matched
    // by the type guard. Without a "gas estimation" / "estimate gas"
    // substring in the message, the substring fallback also misses —
    // documenting that cross-realm / fake instances require SDK-wrapped
    // errors or a recognisable message to be classified.
    class FakeEstimateNativeFeeError extends Error {
      override name = 'EstimateNativeFeeError'
    }
    const err = new FakeEstimateNativeFeeError('opaque message with no hint')
    expect(isGasEstimationError(err)).toBe(false)
  })

  it('should be case-insensitive', () => {
    expect(isGasEstimationError(new Error('Gas Estimation Failed'))).toBe(true)
    expect(isGasEstimationError(new Error('GAS ESTIMATION'))).toBe(true)
    expect(
      isGasEstimationError(new Error('FAILED TO ESTIMATE GAS FOR SWAP'))
    ).toBe(true)
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
    expect(
      shouldRetryWithNextQuote(
        new Error(
          'Failed to estimate gas for Markr swap transaction. Revert: TargetCallFailed().'
        )
      )
    ).toBe(true)
  })

  it('should return true for invalid response errors', () => {
    expect(
      shouldRetryWithNextQuote(new Error('invalid response from aggregator'))
    ).toBe(true)
    expect(
      shouldRetryWithNextQuote(new Error('response validation failed'))
    ).toBe(true)
  })

  it('should return true for transaction-reverted errors (errorCode 5006)', () => {
    // SwapContext rethrow shape: `Transfer failed: ${errorReason ?? errorCode}`
    expect(
      shouldRetryWithNextQuote(
        new Error('Transfer failed: Source transaction was reverted')
      )
    ).toBe(true)
    expect(shouldRetryWithNextQuote(new Error('Transfer failed: 5006'))).toBe(
      true
    )
    // Direct SDK errorReason text (case-insensitive)
    expect(
      shouldRetryWithNextQuote(new Error('source transaction was reverted'))
    ).toBe(true)
    expect(
      shouldRetryWithNextQuote(new Error('Target transaction was reverted'))
    ).toBe(true)
  })

  it('should NOT retry on ERC20 approval reverts or other generic "transaction was reverted" phrasings', () => {
    // The SDK's Markr handler also emits "transaction was reverted" phrasings
    // for ERC20 approval reverts. Those are not gas-OOG and shouldn't auto-retry.
    expect(
      shouldRetryWithNextQuote(
        new Error('Transfer failed: ERC20 approval transaction was reverted')
      )
    ).toBe(false)
    expect(
      shouldRetryWithNextQuote(
        new Error('the transaction was reverted by the EVM')
      )
    ).toBe(false)
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
      'Insufficient balance to cover swap amount and fees.'
    )
    expect(getSwapErrorMessage(new Error('insufficient funds'))).toBe(
      'Insufficient balance to cover swap amount and fees.'
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

  it('should return retry-friendly message for transaction-reverted errors', () => {
    expect(
      getSwapErrorMessage(
        new Error('Transfer failed: Source transaction was reverted')
      )
    ).toBe('Swap failed on-chain. Please try again with a fresh quote.')
    expect(
      getSwapErrorMessage(new Error('Target transaction was reverted'))
    ).toBe('Swap failed on-chain. Please try again with a fresh quote.')
    expect(getSwapErrorMessage(new Error('Transfer failed: 5006'))).toBe(
      'Swap failed on-chain. Please try again with a fresh quote.'
    )
  })

  it('lets sibling branches win when they match earlier in the cascade', () => {
    // If a future SDK message contains both "slippage" and "5006", the
    // slippage branch wins — locks in current cascade order so behaviour
    // doesn't silently flip if the cascade is reordered later.
    expect(
      getSwapErrorMessage(new Error('slippage tolerance exceeded (code 5006)'))
    ).toBe('Price moved too much. Try increasing slippage tolerance.')
    expect(
      getSwapErrorMessage(new Error('quote expired during 5006 path'))
    ).toBe('Quote expired. Please try again.')
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

describe('isGasOnlyNetworkFeeError', () => {
  it('returns true for networkFeeExceedsBalance', () => {
    expect(
      isGasOnlyNetworkFeeError(
        fusionErrors.networkFeeExceedsBalance('0.001 AVAX')
      )
    ).toBe(true)
  })

  it('returns true for amountExceedsBalanceAfterNetworkFee', () => {
    expect(
      isGasOnlyNetworkFeeError(
        fusionErrors.amountExceedsBalanceAfterNetworkFee('0.001 AVAX')
      )
    ).toBe(true)
  })

  it('returns true for networkFeeExceedsNativeBalance', () => {
    expect(
      isGasOnlyNetworkFeeError(
        fusionErrors.networkFeeExceedsNativeBalance('AVAX', '0.001 AVAX')
      )
    ).toBe(true)
  })

  it('returns false for feesExceedBalance (includes bridge fee)', () => {
    expect(
      isGasOnlyNetworkFeeError(fusionErrors.feesExceedBalance('0.002 AVAX'))
    ).toBe(false)
  })

  it('returns false for feesExceedNativeBalance (includes bridge fee)', () => {
    expect(
      isGasOnlyNetworkFeeError(
        fusionErrors.feesExceedNativeBalance('AVAX', '0.002 AVAX')
      )
    ).toBe(false)
  })

  it('returns false for amountExceedsBalanceAfterFees (includes bridge fee)', () => {
    expect(
      isGasOnlyNetworkFeeError(
        fusionErrors.amountExceedsBalanceAfterFees('0.002 AVAX')
      )
    ).toBe(false)
  })

  it('returns false for unrelated errors', () => {
    expect(isGasOnlyNetworkFeeError(fusionErrors.exceedsBalance())).toBe(false)
    expect(isGasOnlyNetworkFeeError(fusionErrors.enterAmount())).toBe(false)
  })
})
