import { NetworkContractToken, NetworkToken } from '@avalabs/chains-sdk'
import { BitcoinInputUTXO } from '@avalabs/wallets-sdk'
import BN from 'bn.js'

export type LocalTokenId = string

export enum TokenType {
  NATIVE = 'NATIVE',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155'
}

type TokenBalanceData = {
  type: TokenType
  balance: BN
  balanceInCurrency: number
  balanceDisplayValue: string
  balanceCurrencyDisplayValue: string
  priceInCurrency: number
  utxos?: BitcoinInputUTXO[]
}

type TokenMarketData = {
  marketCap: number
  change24: number
  vol24: number
}

export type NetworkTokenWithBalance = TokenBalanceData &
  TokenMarketData &
  NetworkToken & {
    coingeckoId: string
    type: TokenType.NATIVE
  }

export type TokenWithBalanceERC20 = TokenBalanceData &
  TokenMarketData &
  NetworkContractToken & {
    type: TokenType.ERC20
  }

export type NftTokenWithBalance = TokenBalanceData &
  TokenMarketData & {
    tokenId: string
    type: TokenType.ERC721 | TokenType.ERC1155
    address: string
    decimals: number
    description: string
    logoUri: string
    name: string
    symbol: string
  }

export type LocalTokenWithBalance = TokenWithBalance & {
  localId: string
}

export type TokenWithBalance =
  | NetworkTokenWithBalance
  | TokenWithBalanceERC20
  | NftTokenWithBalance

export type Balance = {
  accountIndex: number
  chainId: number
  tokens: LocalTokenWithBalance[]
}

export type Balances = { [chainId_address: string]: Balance }

export enum QueryStatus {
  /**
   * Indicates no query is in flight
   */
  IDLE = 'idle',

  /**
   * Indicates the query is being run for the first time
   * This status is usually used to show a skeleton loader
   */
  LOADING = 'loading',

  /**
   * Indicates the query is being re-run on demand (user clicks refetch for example)
   * This status is usually used to show a refresh indicator (with ScrollView, Flatlist,...)
   */
  REFETCHING = 'refetching',

  /**
   * Indicates that a polling query is currently in flight.
   * For example if the query runs every 10 seconds then
   * the status will switch to `polling` every 10 seconds until
   * the query has resolved.
   */
  POLLING = 'polling'
}

export type BalanceState = {
  status: QueryStatus
  balances: Balances
}
