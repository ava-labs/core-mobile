import { useMemo } from 'react'
import { useBalanceTotalInCurrencyForImportedAccounts } from './useBalanceTotalInCurrencyForImportedAccounts'
import { useImportedAccountXpBalances } from './useImportedAccountXpBalances'
import { useIsBalanceLoadedForImportedPlatformAccount } from './useIsBalanceLoadedForImportedPlatformAccount'

export const useBalanceForImportedPlatformAccount = (
  chainId: number
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const { results, refetch } = useImportedAccountXpBalances(chainId)
  const accountBalance = useBalanceTotalInCurrencyForImportedAccounts()
  const isBalanceLoaded = useIsBalanceLoadedForImportedPlatformAccount(chainId)

  const isFetching = useMemo(
    () => results.some(r => r.isLoading || r.isFetching),
    [results]
  )

  return {
    balance: accountBalance,
    fetchBalance: refetch,
    isFetchingBalance: isFetching,
    isBalanceLoaded
  }
}
