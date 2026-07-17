import { bigintToBig } from '@avalabs/core-utils-sdk'
import { formatTokenAmount } from 'utils/Utils'
import type { Network } from '@avalabs/core-chains-sdk'
import {
  isSdkError,
  isEstimateNativeFeeError,
  isInsufficientFundsError
} from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { FusionQuoteError, fusionErrors } from '../../utils/fusionErrors'
import { getSwappableBalance } from '../../utils/getSwappableBalance'

export const getFeeEstimationError = (error: unknown): FusionQuoteError => {
  if (isEstimateNativeFeeError(error)) {
    // When the SDK confirms the cause is an InsufficientFundsError we can
    // surface a precise message (native vs token shortfall).
    if (
      error.causedByInsufficientFunds() &&
      isInsufficientFundsError(error.cause)
    ) {
      return fusionErrors.insufficientFundsForFee(
        error.cause.insufficientTokenWasNative
      )
    }

    // For any other EstimateNativeFeeError (cause absent, e.g. Solana Kit
    // simulation failure, or cause present but unrecognised) we fall back to a
    // generic insufficient-funds message rather than propagating an opaque
    // gas-estimation-failed error.
    return fusionErrors.insufficientFundsForFee(undefined)
  }

  const message = isSdkError(error)
    ? error.walk().message
    : error instanceof Error
    ? error.message
    : ''
  if (message.toLowerCase().includes('arithmetic underflow or overflow')) {
    return fusionErrors.swapAmountTooSmall()
  }

  return fusionErrors.gasEstimationFailed()
}

/**
 * Derives a validation-time additive bps value from the Max bps flag.
 * Subtracts a reduction to give Max a 10% head-room, clamped to 0
 * so a low PostHog value never produces negative buffered fees.
 */
export const deriveValidationAdditiveBps = (
  maxBps: number,
  reduction = 1000
): number => Math.max(0, maxBps - reduction)

/**
 * Validates balance for native token swaps.
 * Gas and source-token bridge fees are both denominated in the same asset.
 *
 * Case 1: gas alone exceeds balance (no bridge fee)
 * Case 2: gas + bridge fees exceed balance (with bridge fee)
 * Case 3: gas + swap amount exceed balance (no bridge fee)
 * Case 4: gas + bridge fees + swap amount exceed balance (with bridge fee)
 */
export const validateNativeToken = ({
  fromToken,
  amount,
  bufferedGasFee,
  bufferedAdditiveFee
}: {
  fromToken: LocalTokenWithBalance
  amount: bigint | undefined
  bufferedGasFee: bigint
  bufferedAdditiveFee: bigint
}): FusionQuoteError | undefined => {
  if (!('decimals' in fromToken)) return undefined

  const totalFee = bufferedGasFee + bufferedAdditiveFee
  const hasBridgeFee = bufferedAdditiveFee > 0n
  const formattedFee = `${formatTokenAmount(
    bigintToBig(totalFee, fromToken.decimals).round(6, 0),
    6
  )} ${fromToken.symbol}`

  // Use the swappable balance so P/X-chain staked/locked funds aren't counted
  // as covering the amount + fee (CP-14788).
  const swappableBalance = getSwappableBalance(fromToken)

  if (swappableBalance < totalFee) {
    return !hasBridgeFee
      ? fusionErrors.networkFeeExceedsBalance(formattedFee) // Case 1: gas alone exceeds balance
      : fusionErrors.feesExceedBalance(formattedFee) // Case 2: gas + bridge fees exceed balance
  }

  if (amount !== undefined && swappableBalance < amount + totalFee) {
    return !hasBridgeFee
      ? fusionErrors.amountExceedsBalanceAfterNetworkFee(formattedFee) // Case 3: gas + swap amount exceed balance
      : fusionErrors.amountExceedsBalanceAfterFees(formattedFee) // Case 4: gas + bridge fees + swap amount exceed balance
  }

  return undefined
}

/**
 * Validates balance for non-native token swaps.
 * Gas (and CCIP bridge fee) are paid in the native asset.
 * deBridge-style fees are paid in the source token.
 *
 * Case 1: native balance < gas + CCIP bridge fee (both present)
 * Case 2: native balance < gas only (no native bridge fee, e.g. deBridge)
 * Case 3: source-token bridge fee alone exceeds token balance
 * Case 4: source-token bridge fee + swap amount exceed token balance
 */
export const validateNonNativeToken = ({
  fromToken,
  fromNetwork,
  nativeTokenBalance,
  amount,
  bufferedGasFee,
  bufferedNativeAdditiveFee,
  bufferedAdditiveFee
}: {
  fromToken: LocalTokenWithBalance
  fromNetwork: Network | undefined
  nativeTokenBalance: bigint | undefined
  amount: bigint | undefined
  bufferedGasFee: bigint
  bufferedNativeAdditiveFee: bigint
  bufferedAdditiveFee: bigint
}): FusionQuoteError | undefined => {
  const totalNativeFee = bufferedGasFee + bufferedNativeAdditiveFee
  const hasNativeBridgeFee = bufferedNativeAdditiveFee > 0n

  if (nativeTokenBalance !== undefined && nativeTokenBalance < totalNativeFee) {
    const nativeToken = fromNetwork?.networkToken
    const symbol = nativeToken?.symbol ?? 'native'
    const formattedAmount = nativeToken
      ? `${formatTokenAmount(
          bigintToBig(totalNativeFee, nativeToken.decimals).round(6, 0),
          6
        )} ${nativeToken.symbol}`
      : totalNativeFee.toString()

    // Case 1: gas + CCIP bridge fee exceed native balance
    if (hasNativeBridgeFee) {
      return fusionErrors.feesExceedNativeBalance(symbol, formattedAmount)
    }

    // Case 2: gas alone exceeds native balance (no native bridge fee, e.g. deBridge)
    return fusionErrors.networkFeeExceedsNativeBalance(symbol, formattedAmount)
  }

  if (bufferedAdditiveFee > 0n && 'decimals' in fromToken) {
    const formattedFee = `${formatTokenAmount(
      bigintToBig(bufferedAdditiveFee, fromToken.decimals).round(6, 0),
      6
    )} ${fromToken.symbol}`

    // Use the swappable balance so P/X-chain staked/locked funds aren't counted
    // as covering the source-token bridge fee + amount (CP-14788). No-op for the
    // ERC20/SPL tokens this path normally handles.
    const swappableBalance = getSwappableBalance(fromToken)

    // Case 3: bridge fee alone exceeds token balance
    if (swappableBalance < bufferedAdditiveFee) {
      return fusionErrors.bridgeFeeExceedsBalance(formattedFee)
    }

    // Case 4: balance covers the fee but not fee + swap amount
    if (
      amount !== undefined &&
      swappableBalance < amount + bufferedAdditiveFee
    ) {
      return fusionErrors.amountExceedsBalanceAfterBridgeFee(formattedFee)
    }
  }

  return undefined
}
