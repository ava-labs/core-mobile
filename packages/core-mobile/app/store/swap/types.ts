import { TokenWithBalance } from 'store/balance'
import { OptimalRate } from 'paraswap-core'

export interface OngoingSwap {
  fromToken?: TokenWithBalance
  toToken?: TokenWithBalance
  optimalRate?: OptimalRate
  gasLimit?: number
  maxFeePerGas?: number // nAvax is used for maxFeePerGas
  maxPriorityFeePerGas?: number // nAvax is used for maxPriorityFeePerGas
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
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    rate: undefined,
    slippage: undefined
  }
}
