import { useMemo } from 'react'
import { useImportedAccountXpBalances } from './useImportedAccountXpBalances'
import { useIsBalanceLoadedForImportedPlatformAccount } from './useIsBalanceLoadedForImportedPlatformAccount'
import { useBalanceTotalInCurrencyForImportedPlatformAccount } from './useBalanceTotalInCurrencyForImportedPlatfomAccount'

export const useBalanceForImportedPlatformAccount = (
  chainId: number
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const { results, refetch } = useImportedAccountXpBalances(chainId, {
    enabled: false
  })

  const accountBalance =
    useBalanceTotalInCurrencyForImportedPlatformAccount(chainId)

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
