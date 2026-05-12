export interface TokenInfo {
  address?: string
  decimals: number
  symbol?: string
  name?: string
}

export interface BalanceChangeItem {
  displayValue: string
  usdPrice: string
  rawValue?: string
}

export interface TokenBalanceChange {
  token: TokenInfo
  items: BalanceChangeItem[]
}

export interface BalanceChangeData {
  ins: TokenBalanceChange[]
  outs: TokenBalanceChange[]
}

// Slippage is in basis points (e.g. 50 = 0.5%); the USD-loss tolerance
// check divides by BASIS_POINTS_DIVISOR.
export type SwapValidationContext = {
  srcTokenAddress: string | undefined
  destTokenAddress: string | undefined
  isSrcTokenNative: boolean
  isDestTokenNative: boolean
  slippage: number | undefined
  minAmountOut: string | undefined
  // Used to net out gas burn from the source-side simulation diff when
  // the source is native — otherwise gas inflates `sourceUsdValue` and
  // breaks the USD-loss check on small native swaps.
  amountIn?: string
  maxBuy: 'unlimited' | '1000' | '5000' | '10000' | '50000' | undefined
  // Quote-attested partner fee in basis points. Added to slippage
  // tolerance in the USD-loss check. Undefined or 0 = no fee added.
  partnerFeeBps?: number
}

export type SwapValidationInput = {
  displayData:
    | {
        isSimulationSuccessful?: boolean
        balanceChange?: BalanceChangeData
      }
    | undefined
  context: SwapValidationContext
}

// One flat union of every reason a Quick Swaps bypass can fall back
// or hard-reject. Codes split into two groups by origin:
//
//   - validateSwapAmounts produces the swap-content reasons (slippage,
//     balance change, amounts, USD pricing, max-buy)
//   - the validator wrapper produces the bypass-shape reasons (context
//     missing, Blockaid alert, validation threw)
//
// Kept as a single union so consumers (analytics, fallback handlers)
// have an exhaustive list to switch on, and so the validator wrapper
// can return `code: ValidationFailReason` without a cast.
export type ValidationFailReason =
  // validateSwapAmounts results
  | 'simulation_failed'
  | 'min_amount_out_missing'
  | 'balance_change_missing'
  | 'token_address_missing'
  | 'source_token_not_found'
  | 'destination_token_not_found'
  | 'amount_calculation_failed'
  | 'amount_below_minimum'
  | 'usd_pricing_unavailable'
  | 'amount_over_limit'
  | 'slippage_unavailable'
  | 'slippage_exceeded'
  // validator-wrapper results
  | 'context_missing'
  | 'tx_flagged_warning'
  | 'tx_flagged_malicious'
  | 'unknown'

export type ValidationResult =
  | { isValid: true }
  | {
      isValid: false
      requiresManualApproval: boolean
      reason: string
      code?: ValidationFailReason
    }
