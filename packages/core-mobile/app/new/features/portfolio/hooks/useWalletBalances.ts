import { QueryObserverResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { selectAccountsByWalletId } from 'store/account'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { useUserBalances } from './useUserBalances'

type AccountId = string

/**
 * Fetches balances for all accounts within the specified wallet across all enabled networks
 * (C-Chain, X-Chain, P-Chain, EVMs, BTC, SOL, etc.).
 *
 * 🔁 Uses one React Query request per account.
 */
export const useWalletBalances = (
  wallet?: Wallet
): {
  data: Record<AccountId, NormalizedBalancesForAccount[]>
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<
    QueryObserverResult<
      Record<AccountId, NormalizedBalancesForAccount[]>,
      Error
    >
  >
} => {
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )

  const {
    data: allAccountsBalances,
    isLoading,
    isFetching,
    refetch
  } = useUserBalances()

  const balances = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.id] = allAccountsBalances?.[account.id] ?? []
      return acc
    }, {} as Record<AccountId, NormalizedBalancesForAccount[]>)
  }, [allAccountsBalances, accounts])

  return {
    data: balances,
    isLoading,
    isFetching,
    refetch
  }
}
