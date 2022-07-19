import * as ethers from 'ethers'
import { BigNumber } from 'ethers'
import BN from 'bn.js'
import { NetworkTokenWithBalance, TokenWithBalanceERC20 } from 'store/balance'
import { NetworkToken } from '@avalabs/chains-sdk'

export interface TransactionParams {
  from: string
  to: string
  value?: string
  data?: string
  gas?: number
  gasPrice?: string
}

export enum RPC_EVENT {
  SIGN = 'sign',
  TRANSACTION = 'transaction',
  SESSION = 'session'
}

export interface DisplayValueParserProps {
  gasPrice: BigNumber
  // erc20Tokens: TokenWithBalanceERC20[]
  avaxToken: NetworkToken
  avaxPrice: number
  site?: PeerMetadata
}

export interface PeerMetadata {
  peerId?: string
  url?: string
  name?: string
  icon?: string
  description?: string
}

export interface TransactionDisplayValues {
  fromAddress: string
  toAddress: string
  gasPrice: BigNumber
  contractType: ContractCall
  gasLimit?: number
  fee?: string
  feeInCurrency?: number
  site?: PeerMetadata
  description?: ethers.utils.TransactionDescription
  [key: string]: any
}
export interface Transaction {
  metamaskNetworkId: string
  chainId?: number
  txParams: TransactionParams
  type: string
  transactionCategory: string
  txHash?: string
  displayValues: TransactionDisplayValues
  error?: string
  tabId?: number
}

export interface RpcTokenReceive {
  chainId: number
  address: string
  decimals: number
  name: string
  symbol: string
  logoURI: string
  id: string
  derivedAVAX: string
  price: number
  balance: string
  balanceValue: string
  amount: string
}

export interface RpcTokenSend {
  name: string
  symbol: string
  decimals: number
  price: number
  balance: string
  balanceValue: string
  amount: string
}

export enum ContractCall {
  APPROVE = 'approve',
  SWAP_EXACT_TOKENS_FOR_TOKENS = 'swapExactTokensForTokens',
  SWAP_TOKENS_FOR_EXACT_TOKENS = 'swapTokensForExactTokens',
  SWAP_AVAX_FOR_EXACT_TOKENS = 'swapAVAXForExactTokens',
  SWAP_EXACT_TOKENS_FOR_AVAX = 'swapExactTokensForAVAX',
  SWAP_EXACT_AVAX_FOR_TOKENS = 'swapExactAVAXForTokens',
  ADD_LIQUIDITY = 'addLiquidity',
  ADD_LIQUIDITY_AVAX = 'addLiquidityAVAX',
  UNKNOWN = 'UNKNOWN'
}

export type ContractParserHandler = (
  request: TransactionParams,
  data: any,
  props?: any,
  txDetails?: ethers.utils.TransactionDescription
) => Promise<TransactionDisplayValues>
export type ContractParser = [ContractCall, ContractParserHandler]

export type BNWithDisplay = { bn: BN; value: string }
export type erc20PathToken = (
  | TokenWithBalanceERC20
  | NetworkTokenWithBalance
) & {
  amountIn?: BNWithDisplay
  amountOut?: BNWithDisplay
  amountUSDValue?: string
}
export interface SwapExactTokensForTokenDisplayValues
  extends TransactionDisplayValues {
  path: erc20PathToken[]
}

export type LiquidityPoolToken = (
  | TokenWithBalanceERC20
  | NetworkTokenWithBalance
) & {
  amountDepositedDisplayValue: string
  amountUSDValue?: string
}
export interface AddLiquidityDisplayData extends TransactionDisplayValues {
  poolTokens: LiquidityPoolToken[]
}

export interface ApproveTransactionData extends TransactionDisplayValues {
  tokenToBeApproved: TokenWithBalanceERC20 | NetworkTokenWithBalance
}
