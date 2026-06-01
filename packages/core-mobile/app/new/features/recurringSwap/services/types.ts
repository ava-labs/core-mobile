import type { Frequency, NumberOfOrders } from '../types'

export type RecurringQuoteParams = {
  appId: string
  chainId: number
  tokenIn: string
  tokenInDecimals: number
  tokenOut: string
  tokenOutDecimals: number
  amount: string // smallest-unit per order
  numberOfOrders: NumberOfOrders // service maps Infinity -> 365
  frequency: Frequency
  slippageBps?: number
}

export type RecurringQuoteFee = {
  type: 'gas' | 'recurring' | 'protocol' | 'swap' | 'other'
  name: string
  amount: string
  token: { chainId: number; address: string }
  extra?: boolean
}

export type RecurringQuoteResult = {
  uuid: string
  appId: string
  chainId: number
  tokenIn: string
  tokenOut: string
  amount: string // per order
  numberOfOrders: number // server-clamped value (may be 365)
  frequency: Frequency
  totalAmountIn: string // amount * numberOfOrders; the allowance to grant
  fees: RecurringQuoteFee[]
  recommendedSlippage: number // basis points, e.g. 50 = 0.5%
  expiredAt: number // unix seconds
}

// Markr v2.0.0: POST /recurring/swap only takes { uuid, appId } — schedule
// params and first-fill minAmountOut are read from the cached quote on the
// server. The client does not re-send them.
export type RecurringSwapParams = {
  uuid: string
  appId: string
}

export type WrappedTx = {
  from: string
  to: string
  data: string
  value: string
}

export interface IRecurringSwapService {
  recurringQuote(params: RecurringQuoteParams): Promise<RecurringQuoteResult>
  recurringSwap(params: RecurringSwapParams): Promise<WrappedTx>
}
