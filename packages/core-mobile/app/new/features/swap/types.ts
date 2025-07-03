import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import type WAVAX_ABI from '../../../contracts/ABI_WAVAX.json'
import type WETH_ABI from '../../../contracts/ABI_WETH.json'
import { TransactionParams } from '@avalabs/evm-module'

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

export type MarkrQuote = {
  uuid: string;
  aggregator?: {
    id: string;
    name: string;
  };
  tokenIn?: string;
  tokenInDecimals?: number;
  amountIn?: string;
  tokenOut?: string;
  tokenOutDecimals?: number;
  amountOut?: string;
  done?: boolean;
}

export type MarkrTransaction = {
  to: string;
  value: string;
  data: string;
}

export type EvmSwapQuote = OptimalRate | EvmWrapQuote | EvmUnwrapQuote | MarkrQuote

// TODO: add solana swap quote
export type SwapQuote = EvmSwapQuote

export type SwapQuoteUpdate = {
  allQuotes: MarkrQuote[]
  bestQuote: MarkrQuote
}

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
  onUpdate?: (update: SwapQuoteUpdate) => void
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


export type PerformSwapParams = {
  srcTokenAddress: string | undefined
  isSrcTokenNative?: boolean
  destTokenAddress: string | undefined
  isDestTokenNative?: boolean
  quote: MarkrQuote | OptimalRate | undefined
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

export interface SwapProvider {
  getQuote: (params: GetQuoteParams, abortSignal: AbortSignal) => Promise<EvmSwapQuote | undefined>
  swap: (params: PerformSwapParams) => Promise<string>
}