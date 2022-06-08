import { NetworkContractToken, NetworkToken } from '@avalabs/chains-sdk'
import { BitcoinInputUTXO } from '@avalabs/wallets-sdk'
import BN from 'bn.js'

export enum TokenType {
  NATIVE = 'NATIVE',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721'
}

type TokenBalanceData = {
  type: TokenType
  balance: BN
  balanceUSD: number
  balanceDisplayValue: string
  balanceUsdDisplayValue: string
  priceUSD: number
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
    id: string // chainId + coingeckoId
    coingeckoId: string
    type: TokenType.NATIVE
  }

export type TokenWithBalanceERC20 = TokenBalanceData &
  TokenMarketData &
  NetworkContractToken & {
    id: string // chainId + token contract address
    type: TokenType.ERC20
  }

export type TokenWithBalanceERC721 = TokenBalanceData &
  TokenMarketData & {
    id: string
    type: TokenType.ERC721
    address: string
    decimals: number
    description: string
    logoUri: string
    name: string
    symbol: string
  }

export type TokenWithBalance =
  | NetworkTokenWithBalance
  | TokenWithBalanceERC20
  | TokenWithBalanceERC721

// export type TokenWithBalance = {
//

//   isNetworkToken: boolean

//   // network token properties
//   coingeckoId?: string
// }

export type Balance = {
  accountIndex: number
  chainId: number
  tokens: TokenWithBalance[]
}

export type BalanceState = {
  balances: { [chainId_address: string]: Balance }
}
