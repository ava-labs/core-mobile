import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import type WAVAX_ABI from '../../../contracts/ABI_WAVAX.json'
import type WETH_ABI from '../../../contracts/ABI_WETH.json'
import { JupiterQuote } from './utils/svm/schemas'

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

export type SwapQuote = EvmSwapQuote | JupiterQuote

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

export const isEvmSwapQuote = (quote: SwapQuote): quote is EvmSwapQuote => {
  return (
    isParaswapQuote(quote) || isEvmWrapQuote(quote) || isEvmUnwrapQuote(quote)
  )
}

export const isJupiterQuote = (quote: SwapQuote): quote is JupiterQuote => {
  return 'inputMint' in quote
}

export type GetQuoteBaseParams = {
  amount: bigint
  fromTokenAddress: string
  fromTokenDecimals: number
  toTokenAddress: string
  toTokenDecimals: number
  destination: SwapSide
  network: Network
}

export type GetEvmQuoteParams = GetQuoteBaseParams & {
  address: string
  isFromTokenNative: boolean
  isToTokenNative: boolean
}

export type GetSolanaQuoteParams = GetQuoteBaseParams & {
  fromTokenBalance?: bigint
  slippage: number
}

export type GetQuoteParams = GetEvmQuoteParams | GetSolanaQuoteParams

export type SwapParams<T extends SwapQuote> = {
  account: Account
  network: Network
  fromTokenAddress: string
  isFromTokenNative: boolean
  toTokenAddress: string
  isToTokenNative: boolean
  quote: T
  slippage: number
}

export type WrapUnwrapTxParams = {
  userAddress: string
  tokenAddress: string
  amount: string
  provider: JsonRpcBatchInternal
  abi: typeof WAVAX_ABI | typeof WETH_ABI
}
