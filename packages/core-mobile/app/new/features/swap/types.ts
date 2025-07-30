import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import type WAVAX_ABI from '../../../contracts/ABI_WAVAX.json'
import type WETH_ABI from '../../../contracts/ABI_WETH.json'
import { MarkrQuote } from './services/MarkrService'
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

export type SvmSwapQuote = JupiterQuote

export type NormalizedSwapQuote = {
  quote: SwapQuote
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

export type SwapQuote = EvmSwapQuote | SvmSwapQuote

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

export const isEvmSwapQuote = (quote: SwapQuote): quote is EvmSwapQuote => {
  return (
    isParaswapQuote(quote) ||
    isEvmWrapQuote(quote) ||
    isEvmUnwrapQuote(quote) ||
    isMarkrQuote(quote)
  )
}

export const isJupiterQuote = (quote: SwapQuote): quote is JupiterQuote => {
  return 'inputMint' in quote
}

export const isSvmSwapQuote = (quote: SwapQuote): quote is SvmSwapQuote => {
  return isJupiterQuote(quote)
}

export type GetQuoteBaseParams = {
  amount: bigint
  fromTokenAddress: string
  fromTokenDecimals: number
  toTokenAddress: string
  toTokenDecimals: number
  destination: SwapSide
  network: Network
  slippage: number
  onUpdate?: (update: NormalizedSwapQuoteResult) => void
}

export type GetEvmQuoteParams = GetQuoteBaseParams & {
  address: string
  isFromTokenNative: boolean
  isToTokenNative: boolean
}

export type GetSvmQuoteParams = GetQuoteBaseParams & {
  fromTokenBalance?: bigint
  slippage: number
  platformFeeBps?: number
}

export type GetQuoteParams = GetEvmQuoteParams | GetSvmQuoteParams

export type SwapParams<T extends SwapQuote> = {
  account: Account
  network: Network
  fromTokenAddress: string
  isFromTokenNative: boolean
  toTokenAddress: string
  isToTokenNative: boolean
  swapProvider: SwapProviders
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

export type PerformSwapBaseParams = {
  srcTokenAddress: string | undefined
  isSrcTokenNative?: boolean
  destTokenAddress: string | undefined
  isDestTokenNative?: boolean
  slippage: number
  network: Network
  userAddress: string | undefined
  isSwapFeesEnabled?: boolean
  markrGasMultiplier?: number
}

export type PerformSwapEvmParams = PerformSwapBaseParams & {
  quote: EvmSwapQuote | undefined
  provider: JsonRpcBatchInternal
  signAndSend: (
    txParams: [TransactionParams],
    context?: Record<string, unknown>
  ) => Promise<string>
}

export type PerformSwapSvmParams = PerformSwapBaseParams & {
  quote: JupiterQuote | undefined
  signAndSend: (
    txParams: SvmTransactionParams[],
    context?: Record<string, unknown>
  ) => Promise<string>
}

export type PerformSwapParams = PerformSwapEvmParams | PerformSwapSvmParams

export enum SwapProviders {
  MARKR = 'markr',
  PARASWAP = 'paraswap',
  WNATIVE = 'wnative',
  JUPITER = 'jupiter'
}

export interface SwapProvider<
  G extends GetQuoteBaseParams,
  P extends PerformSwapBaseParams
> {
  name: string
  getQuote: (
    params: G,
    abortSignal?: AbortSignal
  ) => Promise<NormalizedSwapQuoteResult | undefined>
  swap: (params: P) => Promise<string>
}

export type SvmTransactionParams = {
  account: string
  serializedTx: string
}
