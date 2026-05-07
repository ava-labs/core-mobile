import { stringToBigint } from 'utils/bigNumbers/stringToBigint'
import { findTokenInBalanceChange } from './helpers'
import {
  BalanceChangeData,
  SwapValidationContext,
  SwapValidationInput,
  TokenBalanceChange,
  ValidationFailReason,
  ValidationResult
} from './types'

const BASIS_POINTS_DIVISOR = 10_000 as const

// Markr's 0.85% partner fee — added to slippage tolerance in
// validateSwapUsdPrices when swap fees are enabled.
const MARKR_PARTNER_FEE_BPS = 85 as const

function fail(
  requiresManualApproval: boolean,
  reason: string,
  code: ValidationFailReason
): ValidationResult {
  return { isValid: false, requiresManualApproval, reason, code }
}

function getMaxBuyLimit(
  maxBuy: SwapValidationContext['maxBuy']
): number | null {
  if (!maxBuy || maxBuy === 'unlimited') {
    return null
  }
  return parseInt(maxBuy, 10)
}

function validateMinAmountOut(
  expectedMinAmountOut: string | undefined
): ValidationResult | null {
  if (!expectedMinAmountOut || expectedMinAmountOut === '0') {
    return fail(
      true,
      'Unable to verify balance change information',
      'min_amount_out_missing'
    )
  }
  return null
}

// Tri-state: undefined or true → continue. Only explicit false rejects.
function validateSimulation(
  isSimulationSuccessful: boolean | undefined
): ValidationResult | null {
  if (isSimulationSuccessful === false) {
    return fail(
      false,
      'Transaction simulation failed - cannot safely auto-approve swap',
      'simulation_failed'
    )
  }
  return null
}

function validateBalanceChange(
  balanceChange: BalanceChangeData | undefined
): ValidationResult | null {
  if (!balanceChange) {
    return fail(
      true,
      'Unable to verify balance change information',
      'balance_change_missing'
    )
  }

  if (!balanceChange.outs || balanceChange.outs.length === 0) {
    return fail(
      true,
      'Unable to verify balance change information',
      'balance_change_missing'
    )
  }

  if (!balanceChange.ins || balanceChange.ins.length === 0) {
    return fail(
      true,
      'Unable to verify balance change information',
      'balance_change_missing'
    )
  }

  return null
}

// Native tokens have no contract address — isSrcTokenNative /
// isDestTokenNative satisfy the address requirement for them.
function validateTokenAddresses(
  srcTokenAddress: string | undefined,
  destTokenAddress: string | undefined,
  isSrcTokenNative: boolean,
  isDestTokenNative: boolean
): ValidationResult | null {
  const srcMissing = !srcTokenAddress && !isSrcTokenNative
  const destMissing = !destTokenAddress && !isDestTokenNative
  if (srcMissing || destMissing) {
    return fail(
      true,
      'Unable to verify balance change information',
      'token_address_missing'
    )
  }
  return null
}

function validateSourceToken(
  balanceChange: BalanceChangeData,
  srcTokenAddress: string | undefined,
  isSrcTokenNative: boolean
): { result: ValidationResult | null; sourceTokenOut?: TokenBalanceChange } {
  const sourceTokenOut = findTokenInBalanceChange(
    balanceChange.outs,
    srcTokenAddress,
    isSrcTokenNative
  )

  if (!sourceTokenOut) {
    return {
      result: fail(
        true,
        'Unable to verify token details or pricing',
        'source_token_not_found'
      )
    }
  }

  return { result: null, sourceTokenOut }
}

function validateDestinationToken(
  balanceChange: BalanceChangeData,
  destTokenAddress: string | undefined,
  isDestTokenNative: boolean
): {
  result: ValidationResult | null
  destinationTokenIn?: TokenBalanceChange
} {
  const destinationTokenIn = findTokenInBalanceChange(
    balanceChange.ins,
    destTokenAddress,
    isDestTokenNative
  )

  if (!destinationTokenIn) {
    return {
      result: fail(
        true,
        'Unable to verify token details or pricing',
        'destination_token_not_found'
      )
    }
  }

  return { result: null, destinationTokenIn }
}

// Computed against simulation's source-side USD value (server-attested)
// so the user can't bypass the cap by tampering with the client.
function validateMaxBuyLimit(
  sourceUsdValue: number,
  maxBuy: SwapValidationContext['maxBuy']
): { isValid: boolean; requiresManualApproval: boolean; reason?: string } {
  const maxBuyLimit = getMaxBuyLimit(maxBuy)

  if (maxBuyLimit === null) {
    return { isValid: true, requiresManualApproval: false }
  }

  if (sourceUsdValue > maxBuyLimit) {
    return {
      isValid: false,
      requiresManualApproval: true,
      reason: `Swap amount ($${sourceUsdValue.toFixed(
        2
      )}) exceeds max buy limit ($${maxBuyLimit})`
    }
  }

  return { isValid: true, requiresManualApproval: false }
}

const sumUsdValue = (items: TokenBalanceChange['items']): number =>
  items.reduce((sum: number, item) => {
    const usdPrice = parseFloat(item.usdPrice || '0')
    return sum + (isNaN(usdPrice) ? 0 : usdPrice)
  }, 0)

const sumRawValue = (items: TokenBalanceChange['items']): bigint => {
  let total = 0n
  for (const item of items) {
    if (item.rawValue === undefined) return -1n
    try {
      total += BigInt(item.rawValue)
    } catch {
      return -1n
    }
  }
  return total
}

// For native sources, the source-OUT bucket contains swap amount +
// gas burn. Without netting gas out, small swaps fail the
// loss-tolerance check because gas alone can be 1-2% of swap value.
// Scales sourceUsdValue by amountIn / totalOut.
const netSourceUsdForNativeGas = (
  rawSourceUsd: number,
  sourceItems: TokenBalanceChange['items'],
  isSrcTokenNative: boolean,
  amountIn: string | undefined
): number => {
  if (!isSrcTokenNative || !amountIn) return rawSourceUsd
  let amountInBig: bigint
  try {
    amountInBig = BigInt(amountIn)
  } catch {
    return rawSourceUsd
  }
  if (amountInBig <= 0n) return rawSourceUsd
  const totalOut = sumRawValue(sourceItems)
  if (totalOut <= 0n || amountInBig > totalOut) return rawSourceUsd
  const PRECISION = 1_000_000n
  const scaled = (amountInBig * PRECISION) / totalOut
  return (rawSourceUsd * Number(scaled)) / Number(PRECISION)
}

function validateLossWithinTolerance(
  sourceUsdValue: number,
  destUsdValue: number,
  context: SwapValidationContext
): ValidationResult | null {
  const slippage = context.slippage
  if (
    slippage === undefined ||
    slippage === null ||
    typeof slippage !== 'number'
  ) {
    return fail(
      true,
      'Unable to verify slippage impact',
      'slippage_unavailable'
    )
  }

  const slippagePercent = slippage / BASIS_POINTS_DIVISOR

  const feePercent = context.isSwapFeesEnabled
    ? MARKR_PARTNER_FEE_BPS / BASIS_POINTS_DIVISOR
    : 0
  const totalPercent = slippagePercent + feePercent

  const minAcceptableUsdValue = sourceUsdValue * (1 - totalPercent)

  if (destUsdValue >= minAcceptableUsdValue) return null

  return fail(true, 'Slippage tolerance exceeded', 'slippage_exceeded')
}

function validateSwapUsdPrices(
  sourceTokenOut: TokenBalanceChange,
  destinationTokenIn: TokenBalanceChange,
  context: SwapValidationContext
): ValidationResult | null {
  if (!sourceTokenOut.items || sourceTokenOut.items.length === 0) {
    return fail(
      true,
      'Unable to verify token details or pricing',
      'usd_pricing_unavailable'
    )
  }

  if (!destinationTokenIn.items || destinationTokenIn.items.length === 0) {
    return fail(
      true,
      'Unable to verify token details or pricing',
      'usd_pricing_unavailable'
    )
  }

  const rawSourceUsdValue = sumUsdValue(sourceTokenOut.items)
  const destUsdValue = sumUsdValue(destinationTokenIn.items)

  if (rawSourceUsdValue === 0 || destUsdValue === 0) {
    return fail(
      true,
      'Unable to verify swap details due to currency price data',
      'usd_pricing_unavailable'
    )
  }

  const sourceUsdValue = netSourceUsdForNativeGas(
    rawSourceUsdValue,
    sourceTokenOut.items,
    context.isSrcTokenNative,
    context.amountIn
  )

  const maxBuyValidation = validateMaxBuyLimit(sourceUsdValue, context.maxBuy)
  if (!maxBuyValidation.isValid) {
    return fail(
      maxBuyValidation.requiresManualApproval,
      maxBuyValidation.reason ?? 'Swap amount exceeds max buy limit',
      'amount_over_limit'
    )
  }

  if (destUsdValue >= sourceUsdValue) return null

  return validateLossWithinTolerance(sourceUsdValue, destUsdValue, context)
}

function calculateActualAmountReceived(
  destinationTokenIn: TokenBalanceChange
): {
  result: ValidationResult | null
  actualAmountReceived?: string
} {
  const tokenDecimals = destinationTokenIn.token?.decimals
  if (tokenDecimals === undefined || tokenDecimals === null) {
    return {
      result: fail(
        true,
        'Unable to verify token details or pricing',
        'amount_calculation_failed'
      )
    }
  }

  try {
    const totalAmount = destinationTokenIn.items.reduce((sum: bigint, item) => {
      const displayValue = item.displayValue || '0'
      const rawAmount = stringToBigint(displayValue, tokenDecimals)
      return sum + rawAmount
    }, 0n)

    const actualAmountReceived = totalAmount.toString()

    if (!actualAmountReceived || actualAmountReceived === '0') {
      return {
        result: fail(
          true,
          'Unable to verify balance change information',
          'amount_calculation_failed'
        )
      }
    }

    return { result: null, actualAmountReceived }
  } catch {
    return {
      result: fail(
        true,
        'Unable to verify balance change information',
        'amount_calculation_failed'
      )
    }
  }
}

function validateAmountMeetsMinimum(
  actualAmountReceived: string,
  expectedMinAmountOut: string
): ValidationResult | null {
  const actualBigInt = BigInt(actualAmountReceived)
  const expectedBigInt = BigInt(expectedMinAmountOut)
  const isAmountValid = actualBigInt >= expectedBigInt

  if (!isAmountValid) {
    return fail(
      true,
      'Swap amount is below the minimum expected quantity',
      'amount_below_minimum'
    )
  }

  return null
}

export const validateSwapAmounts = (
  input: SwapValidationInput
): ValidationResult => {
  const { displayData, context } = input

  const minAmountResult = validateMinAmountOut(context.minAmountOut)
  if (minAmountResult) return minAmountResult

  const simulationResult = validateSimulation(
    displayData?.isSimulationSuccessful
  )
  if (simulationResult) return simulationResult

  const balanceChange = displayData?.balanceChange
  const balanceChangeResult = validateBalanceChange(balanceChange)
  if (balanceChangeResult) return balanceChangeResult

  const srcTokenAddress = context.srcTokenAddress
  const destTokenAddress = context.destTokenAddress
  const tokenAddressResult = validateTokenAddresses(
    srcTokenAddress,
    destTokenAddress,
    context.isSrcTokenNative,
    context.isDestTokenNative
  )
  if (tokenAddressResult) return tokenAddressResult

  const { result: sourceResult, sourceTokenOut } = validateSourceToken(
    balanceChange!,
    srcTokenAddress,
    context.isSrcTokenNative
  )
  if (sourceResult) return sourceResult

  const { result: destResult, destinationTokenIn } = validateDestinationToken(
    balanceChange!,
    destTokenAddress,
    context.isDestTokenNative
  )
  if (destResult) return destResult

  const usdResult = validateSwapUsdPrices(
    sourceTokenOut!,
    destinationTokenIn!,
    context
  )
  if (usdResult) return usdResult

  const { result: amountResult, actualAmountReceived } =
    calculateActualAmountReceived(destinationTokenIn!)
  if (amountResult) return amountResult

  const minimumResult = validateAmountMeetsMinimum(
    actualAmountReceived!,
    context.minAmountOut!
  )
  if (minimumResult) return minimumResult

  return { isValid: true }
}
