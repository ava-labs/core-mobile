import { GasPrice } from 'utils/GasPriceHook'
import {
  AvaxWithBalance,
  ERC20WithBalance
} from '@avalabs/wallet-react-components'
import { ExplainTransactionResponse } from '@avalabs/blizzard-sdk'
import * as ethers from 'ethers'
import BN from 'bn.js'

export interface RpcTxParams {
  from: string
  to: string
  value?: string
  data?: string
  gas?: string
  gasPrice?: string
}

export enum RPC_EVENT {
  SIGN = 'sign',
  TRANSACTION = 'transaction',
  SESSION = 'session'
}

export interface DisplayValueParserProps {
  gasPrice: GasPrice
  erc20Tokens: ERC20WithBalance[]
  avaxToken: AvaxWithBalance
  avaxPrice: number
  site: PeerMetadata
}

export interface PeerMetadata {
  peerId: string,
  url: string
  name?: string
  icon?: string
  description?: string
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
  site: PeerMetadata
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
