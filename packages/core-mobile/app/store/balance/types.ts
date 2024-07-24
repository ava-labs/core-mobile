import { NetworkToken } from '@avalabs/chains-sdk'
import { BitcoinInputUTXOWithOptionalScript } from '@avalabs/wallets-sdk'
import BN from 'bn.js'
import { PChainBalance, XChainBalances } from '@avalabs/glacier-sdk'
import { Avax } from 'types'
import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'

export type LocalTokenId = string

type TokenBalanceData = {
  type: TokenType
  balance: BN
  balanceInCurrency: number
  balanceDisplayValue: string
  balanceCurrencyDisplayValue: string
  priceInCurrency: number
  utxos?: BitcoinInputUTXOWithOptionalScript[]
}

type TokenMarketData = {
  marketCap: number
  change24: number
  vol24: number
}

export type PTokenWithBalance = Omit<TokenBalanceData, 'utxos'> &
  TokenMarketData &
  NetworkToken &
  PChainBalance & {
    coingeckoId: string
    type: TokenType.NATIVE
    utxos: PChainBalance
    utxoBalances: XPChainUtxoBalances
  }

export type XTokenWithBalance = Omit<TokenBalanceData, 'utxos'> &
  TokenMarketData &
  NetworkToken &
  XChainBalances & {
    coingeckoId: string
    type: TokenType.NATIVE
    utxos: XChainBalances
    utxoBalances: XPChainUtxoBalances
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
  | PTokenWithBalance
  | XTokenWithBalance

export type Balance = {
  dataAccurate: boolean
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

export interface PChainUtxoBalances {
  lockedStaked?: Avax
  lockedStakeable?: Avax
  lockedPlatform?: Avax
  atomicMemoryLocked?: Avax
  atomicMemoryUnlocked?: Avax
  unlockedUnstaked?: Avax
  unlockedStaked?: Avax
  pendingStaked?: Avax
}

export interface XChainUtxoBalances {
  unlocked?: Avax
  locked?: Avax
  atomicMemoryUnlocked?: Avax
  atomicMemoryLocked?: Avax
}

export type XPChainUtxoBalances = Record<string, string | undefined>

export const assetPDisplayNames: Record<string, string> = {
  lockedStaked: 'Locked Staked',
  lockedStakeable: 'Locked Stakeable',
  lockedPlatform: 'Locked Platform',
  atomicMemoryLocked: 'Atomic Memory Locked',
  atomicMemoryUnlocked: 'Atomic Memory Unlocked',
  unlockedUnstaked: 'Unlocked Unstaked',
  unlockedStaked: 'Unlocked Staked',
  pendingStaked: 'Pending Staked'
}

export const assetXDisplayNames: Record<string, string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  atomicMemoryLocked: 'Atomic Memory Locked',
  atomicMemoryUnlocked: 'Atomic Memory Unlocked'
}
