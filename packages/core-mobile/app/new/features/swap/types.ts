import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import type WAVAX_ABI from '../../../contracts/ABI_WAVAX.json'
import type WETH_ABI from '../../../contracts/ABI_WETH.json'

export enum SwapType {
  EVM = 'EVM',
  SOLANA = 'SOLANA'
}

export enum EvmSwapOperation {
  WRAP = 'WRAP',
  UNWRAP = 'UNWRAP'
}

export type EvmWrapQuote = {
  operation: EvmSwapOperation.WRAP
  target: string
  amount: string
}

export type EvmUnwrapQuote = {
  operation: EvmSwapOperation.UNWRAP
  source: string
  amount: string
}

export type EvmSwapQuote = OptimalRate | EvmWrapQuote | EvmUnwrapQuote

// TODO: add solana swap quote
export type SwapQuote = EvmSwapQuote

export function isEvmWrapQuote(quote: SwapQuote): quote is EvmWrapQuote {
  return 'operation' in quote && quote.operation === EvmSwapOperation.WRAP
}

export function isEvmUnwrapQuote(quote: SwapQuote): quote is EvmUnwrapQuote {
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
  fromTokenAddress: string
  fromTokenDecimals: number
  isFromTokenNative: boolean
  toTokenAddress: string
  toTokenDecimals: number
  isToTokenNative: boolean
  destination: SwapSide
  network: Network
}

export type SwapParams = {
  account: Account
  network: Network
  fromTokenAddress: string
  isFromTokenNative: boolean
  toTokenAddress: string
  isToTokenNative: boolean
  quote: EvmSwapQuote
  slippage: number
}

export type WrapUnwrapTxParams = {
  userAddress: string
  tokenAddress: string
  amount: string
  provider: JsonRpcBatchInternal
  abi: typeof WAVAX_ABI | typeof WETH_ABI
}
