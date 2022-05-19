import { BitcoinInputUTXO } from '@avalabs/wallets-sdk'
import BN from 'bn.js'

export type TokenWithBalance = {
  name: string
  symbol: string
  address?: string
  logoURI?: string
  isErc20?: boolean
  isAvax?: boolean
  isAnt?: boolean
  balance: BN
  balanceUSD?: number
  balanceDisplayValue?: string
  balanceUsdDisplayValue?: string
  priceUSD?: number
  color?: string
  denomination?: number
  decimals?: number
  utxos?: BitcoinInputUTXO[]
}

export type Balance = {
  accountIndex: number
  chainId: number
  tokens: TokenWithBalance[]
}
export type BalanceState = {
  balances: Record<string, Balance>
}
