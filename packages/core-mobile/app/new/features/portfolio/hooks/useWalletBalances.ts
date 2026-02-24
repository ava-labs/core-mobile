import { QueryObserverResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccounts } from 'services/balance/types'
import { selectAccountsByWalletId, selectImportedAccounts } from 'store/account'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID } from 'new/features/wallets/consts'
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
  const isVirtualImportedWallet =
    wallet?.id === IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID

  // For the virtual "Imported" wallet, imported accounts have their own
  // real walletId — not the virtual ID — so selectAccountsByWalletId
  // would return an empty array. Fall back to selectImportedAccounts.
  const accountsByWalletId = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )
  const importedAccounts = useSelector(selectImportedAccounts)
  const accounts = isVirtualImportedWallet
    ? importedAccounts
    : accountsByWalletId

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
