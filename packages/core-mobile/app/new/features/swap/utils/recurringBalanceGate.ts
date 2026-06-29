// Pure balance-gate logic for the recurring-swap "Next" button, extracted from
// SwapScreen so the native / ERC-20 / combined shortfall branches are unit
// testable without standing up the whole screen. Returns a `FusionQuoteError`
// (or null) that the screen feeds into `validationError`, which both renders
// inline and disables submission via `isRecurringReady`.

import { formatTokenAmount } from 'utils/Utils'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import type { NumberOfOrders } from 'features/recurringSwap/types'
import { fusionErrors, type FusionQuoteError } from './fusionErrors'

const formatTokenWithSymbol = (
  amount: bigint,
  token: LocalTokenWithBalance
): string =>
  'decimals' in token
    ? `${formatTokenAmount(
        bigintToBig(amount, token.decimals),
        token.decimals
      )} ${token.symbol}`
    : `${amount}`

export type RecurringBalanceGateParams = {
  numberOfOrders: NumberOfOrders | undefined
  /** Authoritative principal from the recurring quote (`amount × orders`). */
  totalAmountIn: bigint | undefined
  /**
   * Sum of the quote's *additive* fees (`fee.extra` truthy) — the one-time
   * native schedule fee the SDK documents as "balance-check separately".
   * Native-denominated; estimated gas is excluded (left to the SDK).
   */
  additiveNativeFee: bigint
  /** Selected source token (drives native vs ERC-20 branch). */
  fromToken: LocalTokenWithBalance
  /** Native gas token for `fromToken`'s chain — funds the schedule fee when
   *  the source is an ERC-20. Undefined when it can't be resolved. */
  nativeFromToken: LocalTokenWithBalance | undefined
}

/**
 * Recurring schedules must fund the WHOLE commitment up front, not just one
 * order. The first fill for a NATIVE source wraps the entire `totalAmountIn`
 * (per-order × order count) to WAVAX in a single tx, and the SDK flags the
 * one-time schedule fee (`fee.extra` truthy, native-denominated) as
 * "balance-check separately" — so the real native requirement is
 * `totalAmountIn + additive native fees`. For an ERC-20 source the principal is
 * drawn from the token balance while the native schedule fee is drawn from the
 * native balance, so the two are checked independently (and surfaced together
 * when both fail). Estimated *gas* is left to the SDK's own estimateGas — the
 * quote reports it in gas units, not a wei cost we can safely reserve here.
 * Returns null for Unlimited (no finite total) and until the quote's
 * `totalAmountIn` is known (the submit gate already blocks on a missing quote).
 */
export function computeRecurringBalanceError({
  numberOfOrders,
  totalAmountIn,
  additiveNativeFee,
  fromToken,
  nativeFromToken
}: RecurringBalanceGateParams): FusionQuoteError | null {
  if (totalAmountIn === undefined) return null
  if (numberOfOrders === undefined || !Number.isFinite(numberOfOrders)) {
    return null
  }

  if (fromToken.type === TokenType.NATIVE) {
    // Principal + native schedule fee both come out of the native balance.
    const required = totalAmountIn + additiveNativeFee
    if (required > fromToken.balance) {
      return fusionErrors.recurringTotalExceedsBalance(
        numberOfOrders,
        formatTokenWithSymbol(required, fromToken)
      )
    }
    return null
  }

  // ERC-20 source: principal is drawn from the token balance, the native
  // schedule fee from the native balance — independent shortfalls. Surface both
  // in one message when both fail so the user isn't asked to fix one, then
  // discover the other.
  const principalShort = totalAmountIn > fromToken.balance
  const feeShort =
    additiveNativeFee > 0n &&
    nativeFromToken !== undefined &&
    additiveNativeFee > nativeFromToken.balance

  if (principalShort && feeShort && nativeFromToken !== undefined) {
    return fusionErrors.recurringInsufficientForTotalAndFee(
      formatTokenWithSymbol(totalAmountIn, fromToken),
      formatTokenWithSymbol(additiveNativeFee, nativeFromToken)
    )
  }
  if (principalShort) {
    return fusionErrors.recurringTotalExceedsBalance(
      numberOfOrders,
      formatTokenWithSymbol(totalAmountIn, fromToken)
    )
  }
  if (feeShort && nativeFromToken !== undefined) {
    return fusionErrors.recurringScheduleFeeExceedsNativeBalance(
      formatTokenWithSymbol(additiveNativeFee, nativeFromToken)
    )
  }
  return null
}
