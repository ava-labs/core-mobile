import { useSelector } from 'react-redux'
import { selectAccountsByWalletId } from 'store/account'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { useAllBalances } from './useAllBalances'

/**
 * Returns true if balances are currently loading for the given wallet.
 * Checks if any account within the wallet is missing balance data.
 */
export const useIsLoadingBalancesForWallet = (wallet?: Wallet): boolean => {
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )
  const { data } = useAllBalances()

  if (!wallet || accounts.length === 0) return true

  // Check if any account in this wallet is missing balance data
  return accounts.some(account => {
    const accountBalances = data[account.id]
    return !accountBalances || accountBalances.length === 0
  })
}
