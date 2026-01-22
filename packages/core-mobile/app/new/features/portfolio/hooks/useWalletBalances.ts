import { QueryObserverResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccounts } from 'services/balance/types'
import { selectAccountsByWalletId } from 'store/account'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { useAllBalances } from './useAllBalances'

/**
 * Fetches balances for all accounts within the specified wallet across all enabled networks
 * (C-Chain, X-Chain, P-Chain, EVMs, BTC, SOL, etc.).
 *
 * 🔁 Uses one React Query request per account.
 */
export const useWalletBalances = (
  wallet?: Wallet
): {
  data: AdjustedNormalizedBalancesForAccounts
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<
    QueryObserverResult<AdjustedNormalizedBalancesForAccounts, Error>
  >
} => {
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )

  const {
    data: allAccountsBalances,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useAllBalances()

  const balances = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.id] = allAccountsBalances?.[account.id] ?? []
      return acc
    }, {} as AdjustedNormalizedBalancesForAccounts)
  }, [allAccountsBalances, accounts])

  return {
    data: balances,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  }
}
