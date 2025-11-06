import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountById } from 'store/account'
import { useBalanceTotalInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceTotalInCurrencyForAccount'
import { useIsBalanceLoadedForAccount } from 'features/portfolio/hooks/useIsBalanceLoadedForAccount'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'

export const useBalanceForAccount = (
  accountId: string
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const account = useSelector(selectAccountById(accountId))
  const { results, refetch } = useAccountBalances(account, {
    enabled: false
  })
  const accountBalance = useBalanceTotalInCurrencyForAccount(account)
  const isBalanceLoaded = useIsBalanceLoadedForAccount(account)

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
