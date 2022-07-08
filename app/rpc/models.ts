import { GasPrice } from 'utils/GasPriceHook'
import {
  AvaxWithBalance,
  ERC20WithBalance
} from '@avalabs/wallet-react-components'
import { ExplainTransactionResponse } from '@avalabs/blizzard-sdk'
import * as ethers from 'ethers'
import { BN } from 'avalanche'

export interface RpcTxParams {
  from: string
  to: string
  value?: string
  data?: string
  gas?: string
  gasPrice?: string
}

export interface DisplayValueParserProps {
  gasPrice: GasPrice
  erc20Tokens: ERC20WithBalance[]
  avaxToken: AvaxWithBalance
  avaxPrice: number
  site: DomainMetadata
}

export interface DomainMetadata {
  domain: string
  name?: string
  icon?: string
}

interface ExtendedTransactionDisplayValues extends ExplainTransactionResponse {
  gasPrice: GasPrice
  gasLimit: number
  fee: string
  bnFee: BN
  feeUSD: number
  tokenAmount?: string
  spender?: string
  [key: string]: any
}

export interface TransactionDisplayValues {
  fromAddress: string
  toAddress: string
  gasPrice: GasPrice
  contractType: ContractCall
  gasLimit?: number
  fee?: string
  feeUSD?: number
  site: DomainMetadata
  description?: ethers.utils.TransactionDescription
  [key: string]: any
}
export interface Transaction {
  id: number | string | void
  time: number
  metamaskNetworkId: string
  chainId: string
  txParams: RpcTxParams
  type: string
  transactionCategory: string
  txHash?: string
  displayValues: ExtendedTransactionDisplayValues
  error?: string
  tabId?: number
}

export enum ContractCall {
  APPROVE = 'approve',
  SWAP_EXACT_TOKENS_FOR_TOKENS = 'swapExactTokensForTokens',
  SWAP_TOKENS_FOR_EXACT_TOKENS = 'swapTokensForExactTokens',
  SWAP_AVAX_FOR_EXACT_TOKENS = 'swapAVAXForExactTokens',
  SWAP_EXACT_TOKENS_FOR_AVAX = 'swapExactTokensForAVAX',
  SWAP_EXACT_AVAX_FOR_TOKENS = 'swapExactAVAXForTokens',
  ADD_LIQUIDITY = 'addLiquidity',
  ADD_LIQUIDITY_AVAX = 'addLiquidityAVAX'
}

export type ContractParserHandler = (
  request: RpcTxParams,
  data: any,
  props?: any,
  txDetails?: ethers.utils.TransactionDescription
) => Promise<TransactionDisplayValues>
export type ContractParser = [ContractCall, ContractParserHandler]

export type BNWithDisplay = { bn: BN; value: string }
export type erc20PathToken = (ERC20WithBalance | AvaxWithBalance) & {
  amountIn?: BNWithDisplay
  amountOut?: BNWithDisplay
  amountUSDValue?: string
}
export interface SwapExactTokensForTokenDisplayValues
  extends TransactionDisplayValues {
  path: erc20PathToken[]
}

export type LiquidityPoolToken = (ERC20WithBalance | AvaxWithBalance) & {
  amountDepositedDisplayValue: string
  amountUSDValue?: string
}
export interface AddLiquidityDisplayData extends TransactionDisplayValues {
  poolTokens: LiquidityPoolToken[]
}

export interface ApproveTransactionData extends TransactionDisplayValues {
  tokenToBeApproved: ERC20WithBalance | AvaxWithBalance
}
