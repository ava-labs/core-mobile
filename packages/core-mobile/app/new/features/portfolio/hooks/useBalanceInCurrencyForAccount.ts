import { useSelector } from 'react-redux'
import { selectAccountById, selectActiveAccount } from 'store/account'
import { selectActiveWallet } from 'store/wallet/slice'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useWalletBalances } from './useWalletBalances'
import { useBalanceTotalInCurrencyForAccount } from './useBalanceTotalInCurrencyForAccount'

/**
 * Returns the total balance and loading state for a given account.
 *
 * Behavior:
 * - For the active account, this hook uses data from `useAccountBalances`,
 *   which fetches balance updates more frequently.
 * - For non-active accounts, it falls back to data from `useWalletBalances`,
 *   which loads once on mount and reuses cached wallet-level data.
 */
export const useBalanceInCurrencyForAccount = (
  accountId: string
): {
  isLoadingBalance: boolean
  balance: number
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const activeWallet = useSelector(selectActiveWallet)
  const account = useSelector(selectAccountById(accountId))

  const isActiveAccount =
    activeAccount && account && activeAccount.id === account.id

  const { data: accountBalance, isLoading: isLoadingAccountBalances } =
    useAccountBalances(isActiveAccount ? activeAccount : undefined)

  const { data: walletBalances } = useWalletBalances(activeWallet)

  const balanceTotalInCurrency = useBalanceTotalInCurrencyForAccount({
    account,
    sourceData: isActiveAccount ? accountBalance : walletBalances?.[accountId]
  })

  const isFetchingBalance = isActiveAccount
    ? isLoadingAccountBalances
    : walletBalances?.[accountId] === undefined

  return {
    balance: balanceTotalInCurrency,
    isLoadingBalance: isFetchingBalance
  }
}
