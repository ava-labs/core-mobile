import { formatTokenAmount } from 'utils/Utils'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { FusionQuoteError, fusionErrors } from './fusionErrors'

/**
 * Computes the current swap validation error (or null if inputs are valid).
 * Extracted from SwapScreen to keep the component's cognitive complexity within
 * limit and to make the validation logic unit-testable.
 *
 * `allowZeroAmount` relaxes the "enter an amount" gate for AVALANCHE_CCT routes,
 * where 0 is a valid input that triggers the SDK's import-only recovery quote.
 */
export function computeValidationError({
  fromTokenValue,
  debouncedFromTokenValue,
  minimumTransferAmount,
  fromToken,
  feeValidationError,
  allowZeroAmount = false
}: {
  fromTokenValue: bigint | undefined
  debouncedFromTokenValue: bigint | undefined
  minimumTransferAmount: bigint | null | undefined
  fromToken: LocalTokenWithBalance | undefined
  feeValidationError: FusionQuoteError | null | undefined
  allowZeroAmount?: boolean
}): FusionQuoteError | null {
  if (fromTokenValue === undefined) return null
  if (debouncedFromTokenValue !== undefined && debouncedFromTokenValue === 0n) {
    if (allowZeroAmount) return null
    return fusionErrors.enterAmount()
  }
  if (
    minimumTransferAmount != null &&
    debouncedFromTokenValue !== undefined &&
    debouncedFromTokenValue > 0n &&
    debouncedFromTokenValue < minimumTransferAmount &&
    fromToken &&
    'decimals' in fromToken
  ) {
    const formattedMin = `${formatTokenAmount(
      bigintToBig(minimumTransferAmount, fromToken.decimals),
      fromToken.decimals
    )} ${fromToken.symbol}`
    return fusionErrors.belowMinimumAmount(formattedMin)
  }
  if (
    debouncedFromTokenValue !== undefined &&
    fromToken !== undefined &&
    debouncedFromTokenValue > fromToken.balance
  ) {
    return fusionErrors.exceedsBalance()
  }
  return feeValidationError ?? null
}
