import { TokenWithBalance } from 'store/balance'
import { OptimalRate } from 'paraswap-core'

export interface OngoingSwap {
  fromToken?: TokenWithBalance
  toToken?: TokenWithBalance
  optimalRate?: OptimalRate
  gasLimit?: number
  gasPrice?: number // nAvax is used for gasPrice
  rate?: number
  slippage?: number
}

export type SwapState = {
  currentSwap: OngoingSwap
}

export const initialState: SwapState = {
  currentSwap: {
    fromToken: undefined,
    toToken: undefined,
    optimalRate: undefined,
    gasLimit: undefined,
    gasPrice: undefined,
    rate: undefined,
    slippage: undefined
  }
}
