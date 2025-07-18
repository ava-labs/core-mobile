import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import type WAVAX_ABI from '../../../contracts/ABI_WAVAX.json'
import type WETH_ABI from '../../../contracts/ABI_WETH.json'
import { MarkrQuote } from './services/MarkrService'

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

export type MarkrTransaction = {
  to: string
  value: string
  data: string
}

export type EvmSwapQuote =
  | OptimalRate
  | EvmWrapQuote
  | EvmUnwrapQuote
  | MarkrQuote

export type NormalizedSwapQuote = {
  quote: EvmSwapQuote
  metadata: {
    amountIn?: string
    amountOut?: string
  } & Record<string, unknown>
}

export type NormalizedSwapQuoteResult = {
  provider: SwapProviders
  quotes: NormalizedSwapQuote[]
  selected: NormalizedSwapQuote
}

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

export const isMarkrQuote = (quote: SwapQuote): quote is MarkrQuote => {
  return (
    'uuid' in quote &&
    'aggregator' in quote &&
    'amountIn' in quote &&
    'tokenIn' in quote &&
    'amountOut' in quote &&
    'tokenOut' in quote
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
  slippage: number
  onUpdate?: (update: NormalizedSwapQuoteResult) => void
}

export type SwapParams = {
  account: Account
  network: Network
  fromTokenAddress: string
  isFromTokenNative: boolean
  toTokenAddress: string
  isToTokenNative: boolean
  swapProvider: SwapProviders
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

export type PerformSwapParams = {
  srcTokenAddress: string | undefined
  isSrcTokenNative?: boolean
  destTokenAddress: string | undefined
  isDestTokenNative?: boolean
  quote: EvmSwapQuote | undefined
  slippage: number
  network: Network
  provider: JsonRpcBatchInternal
  userAddress: string | undefined
  signAndSend: (
    txParams: [TransactionParams],
    context?: Record<string, unknown>
  ) => Promise<string>
  isSwapFeesEnabled?: boolean
}

export enum SwapProviders {
  MARKR = 'markr',
  PARASWAP = 'paraswap',
  WNATIVE = 'wnative'
}

export interface SwapProvider {
  name: string
  getQuote: (
    params: GetQuoteParams,
    abortSignal?: AbortSignal
  ) => Promise<NormalizedSwapQuoteResult | undefined>
  swap: (params: PerformSwapParams) => Promise<string>
}
