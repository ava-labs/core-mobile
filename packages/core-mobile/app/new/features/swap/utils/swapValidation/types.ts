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
// check divides by 10_000.
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
  // True when quote.partnerFeeBps > 0; adds 0.85% to slippage tolerance.
  isSwapFeesEnabled: boolean
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

export type ValidationFailReason =
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

export type ValidationResult =
  | { isValid: true }
  | {
      isValid: false
      requiresManualApproval: boolean
      reason: string
      code?: ValidationFailReason
    }
