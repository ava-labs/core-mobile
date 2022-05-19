import { NetworkContractTokenResourceLink } from '@avalabs/chains-sdk'
import BN from 'bn.js'
import { StringOrNumberOrList } from 'victory-core'

export interface NetworkContractToken {
  resourceLinks: NetworkContractTokenResourceLink[]
}

export interface NetworkToken {
  coingeckoId: string
}

export type TokenWithBalance = {
  id: string // the id is chainId + tokenId (either coingeckoId, address or symbol)
  name: string
  symbol: string
  description?: string
  logoUri?: string
  balance: BN
  balanceUSD?: number
  balanceDisplayValue?: string
  balanceUsdDisplayValue?: string
  priceUSD: number
  decimals?: number
  marketCap: number
  change24: number
  vol24: number
  isNetworkToken: boolean

  // network token properties
  coingeckoId?: string

  // erc-20 token properties
  address?: string
  assetType?: string
  contractType?: string
  chainId?: StringOrNumberOrList
  officialSite?: string
  resourceLinks?: NetworkContractTokenResourceLink[]
}

export type Balance = {
  accountIndex: number
  chainId: number
  tokens: TokenWithBalance[]
}

export type BalanceState = {
  balances: { [chainId_address: string]: Balance }
}
