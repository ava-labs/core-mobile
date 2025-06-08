import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { LocalTokenWithBalance } from 'store/balance/types'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'

export enum EvmSwapOperation {
  WRAP = 'WRAP',
  UNWRAP = 'UNWRAP'
}

export type EvmWrapOperation = {
  operation: EvmSwapOperation.WRAP
  target: string
  amount: string
}

export type EvmUnwrapOperation = {
  operation: EvmSwapOperation.UNWRAP
  source: string
  amount: string
}

export type EvmSwapQuote = OptimalRate | EvmWrapOperation | EvmUnwrapOperation

// TODO: add solana swap quote
export type SwapQuote = EvmSwapQuote

export function isWrapOperation(quote: SwapQuote): quote is EvmWrapOperation {
  return 'operation' in quote && quote.operation === EvmSwapOperation.WRAP
}

export function isUnwrapOperation(
  quote: SwapQuote
): quote is EvmUnwrapOperation {
  return 'operation' in quote && quote.operation === EvmSwapOperation.UNWRAP
}

export const isParaswapQuote = (quote: SwapQuote): quote is OptimalRate => {
  return (
    'srcAmount' in quote &&
    'destAmount' in quote &&
    'srcToken' in quote &&
    'destToken' in quote
  )
}

export type GetQuoteParams = {
  account: Account
  amount: bigint
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  destination: SwapSide
  network: Network
}

export type SwapParams = {
  account: Account
  network: Network
  srcTokenAddress: string
  isSrcTokenNative: boolean
  destTokenAddress: string
  isDestTokenNative: boolean
  quote: EvmSwapQuote
  slippage: number
}
