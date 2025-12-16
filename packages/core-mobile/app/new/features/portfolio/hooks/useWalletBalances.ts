import { QueryObserverResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { selectAccountsByWalletId } from 'store/account'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { useAccountsBalances } from './useAccountsBalances'

type AccountId = string

/**
 * Fetches balances for all accounts within the specified wallet across all enabled networks
 * (C-Chain, X-Chain, P-Chain, EVMs, BTC, SOL, etc.).
 *
 * 🔁 Uses one React Query request per account.
 */
export const useWalletBalances = (
  wallet?: Wallet,
  options?: { refetchInterval?: number | false }
): {
  data: Record<AccountId, AdjustedNormalizedBalancesForAccount[]>
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<
    QueryObserverResult<AdjustedNormalizedBalancesForAccount[], Error>[]
  >
} => {
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )

  return useAccountsBalances(accounts ?? [], options)
}
