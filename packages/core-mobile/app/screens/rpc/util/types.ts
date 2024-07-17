import BN from 'bn.js'
import { TransactionDescription } from 'ethers'
import { NetworkTokenUnit } from 'types'
import { PeerMeta } from 'store/rpc/types'
import type { TokenWithBalance } from '@avalabs/vm-module-types'

export interface TransactionDisplayValues {
  fromAddress?: string
  toAddress?: string
  maxFeePerGas?: NetworkTokenUnit
  maxPriorityFeePerGas?: NetworkTokenUnit
  maxTotalFee?: NetworkTokenUnit
  contractType?: ContractCall
  gasLimit?: number
  fee?: string
  feeInCurrency?: number
  site?: PeerMeta | null | undefined
  description?: TransactionDescription
  displayValue?: string
  bnFee?: bigint
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export enum ContractCall {
  APPROVE = 'approve',
  SWAP_EXACT_TOKENS_FOR_TOKENS = 'swapExactTokensForTokens',
  SWAP_TOKENS_FOR_EXACT_TOKENS = 'swapTokensForExactTokens',
  SWAP_AVAX_FOR_EXACT_TOKENS = 'swapAVAXForExactTokens',
  SWAP_EXACT_TOKENS_FOR_AVAX = 'swapExactTokensForAVAX',
  SWAP_EXACT_AVAX_FOR_TOKENS = 'swapExactAVAXForTokens',
  SWAP_TOKENS_FOR_EXACT_AVAX = 'swapTokensForExactAVAX',
  ADD_LIQUIDITY = 'addLiquidity',
  ADD_LIQUIDITY_AVAX = 'addLiquidityAVAX',
  UNKNOWN = 'UNKNOWN'
}

export type BNWithDisplay = { bn: BN; value: string }
export type erc20PathToken = TokenWithBalance & {
  amountIn?: BNWithDisplay
  amountOut?: BNWithDisplay
  amountCurrencyValue?: string
}
export interface SwapExactTokensForTokenDisplayValues
  extends TransactionDisplayValues {
  path: erc20PathToken[]
}

export type LiquidityPoolToken = TokenWithBalance & {
  amountDepositedDisplayValue: string
  amountCurrencyValue?: string
}
export interface AddLiquidityDisplayData extends TransactionDisplayValues {
  poolTokens: LiquidityPoolToken[]
}

export interface ApproveTransactionData extends TransactionDisplayValues {
  tokenToBeApproved: TokenWithBalance
}

export const isAddLiquidityDisplayData = (
  data: TransactionDisplayValues
): data is AddLiquidityDisplayData => {
  return 'poolTokens' in data
}

export const isSwapExactTokensForTokenDisplayValues = (
  data: TransactionDisplayValues
): data is SwapExactTokensForTokenDisplayValues => {
  return 'path' in data
}
