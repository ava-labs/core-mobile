import { type Error, type TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance/types'

export type NormalizedBalancesForAccount = {
  accountId: string
  chainId: number
  tokens: LocalTokenWithBalance[]
  dataAccurate: boolean
  error: Error | null
}

// new adjusted types to work with the new backend balance service
export type AdjustedLocalTokenWithBalance = Omit<
  LocalTokenWithBalance,
  'coingeckoId' | 'marketCap' | 'vol24' | 'description'
> & {
  type: TokenType.NATIVE | TokenType.ERC20 | TokenType.SPL
  decimals: number
}

export type AdjustedNormalizedBalancesForAccount = Omit<
  NormalizedBalancesForAccount,
  'tokens'
> & {
  tokens: AdjustedLocalTokenWithBalance[]
}
