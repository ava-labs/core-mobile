import { Wallet } from 'store/wallet/types'
import { selectAccountsByWalletId } from 'store/account'
import { useSelector } from 'react-redux'
import { RootState } from 'store/types'
import * as store from '../store'
import { useIsRefetchingXpBalancesForWallet } from './useIsRefetchingXpBalancesForWallet'

/**
 * Returns true if any balance query is manually refetching
 * after having loaded successfully for the given wallet.
 */
export function useIsRefetchingBalancesForWallet(wallet?: Wallet): boolean {
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )
  const [isRefetchingAccountBalances] = store.useIsRefetchingAccountBalances()
  const isRefetchingWalletXpBalances =
    useIsRefetchingXpBalancesForWallet(wallet)
  return (
    accounts.some(account => isRefetchingAccountBalances[account.id ?? '']) ||
    isRefetchingWalletXpBalances
  )
}
