import { type Error } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance/types'

export type AdjustedLocalTokenWithBalance = Omit<
  LocalTokenWithBalance,
  'coingeckoId' | 'marketCap' | 'vol24' | 'description'
>

export type AdjustedNormalizedBalancesForAccount = {
  accountId: string
  chainId: number
  tokens: AdjustedLocalTokenWithBalance[]
  dataAccurate: boolean
  error: Error | null
}

export type AdjustedNormalizedBalancesForAccounts = Record<
  string,
  AdjustedNormalizedBalancesForAccount[]
>

export type PartialAdjustedNormalizedBalancesForAccount = Record<
  string,
  AdjustedNormalizedBalancesForAccount
>
