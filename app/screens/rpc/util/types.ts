import * as ethers from 'ethers'
import { BigNumber } from 'ethers'
import BN from 'bn.js'
import { NetworkTokenWithBalance, TokenWithBalance } from 'store/balance'
import { Network } from '@avalabs/chains-sdk'
import { FindToken } from 'contracts/contractParsers/utils/useFindToken'

export interface TransactionParams {
  from: string
  to: string
  value: string
  data: string
  gas?: number
  gasPrice?: string
}

export enum RPC_EVENT {
  SIGN_MESSAGE = 'sign_message',
  SIGN_TRANSACTION = 'sign_transaction',
  SESSION_REQUEST = 'session_request',
  UPDATE_CONTACT = 'update_contact'
}

export interface DisplayValueParserProps {
  gasPrice: BigNumber
  avaxToken: NetworkTokenWithBalance
  avaxPrice: number
  erc20Tokens: TokenWithBalance[]
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
  fromAddress?: string
  toAddress?: string
  gasPrice?: BigNumber
  contractType?: ContractCall
  gasLimit?: number
  fee?: string
  feeInCurrency?: number
  site?: PeerMetadata
  description?: ethers.utils.TransactionDescription
  displayValue?: string
  bnFee?: BigNumber
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}
export interface Transaction {
  id?: number | string
  metamaskNetworkId?: string
  method: string
  chainId?: number
  txParams: TransactionParams
  displayValues: TransactionDisplayValues
  txHash?: string
  error?: string
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
  SWAP_TOKENS_FOR_EXACT_AVAX = 'swapTokensForExactAVAX',
  ADD_LIQUIDITY = 'addLiquidity',
  ADD_LIQUIDITY_AVAX = 'addLiquidityAVAX',
  UNKNOWN = 'UNKNOWN'
}

export type ContractParserHandler = (
  findToken: FindToken,
  network: Network,
  request: TransactionParams,
  data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  props: DisplayValueParserProps,
  txDetails?: ethers.utils.TransactionDescription
) => Promise<TransactionDisplayValues>
export type ContractParser = [ContractCall, ContractParserHandler]

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
