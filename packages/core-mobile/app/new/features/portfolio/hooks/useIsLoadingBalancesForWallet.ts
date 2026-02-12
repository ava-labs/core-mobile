import { useSelector } from 'react-redux'
import {
  selectAccountsByWalletId,
  selectImportedAccounts
} from 'store/account'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID } from 'features/wallets/consts'
import { useAllBalances } from './useAllBalances'

/**
 * Returns true if balances are currently loading for the given wallet.
 * Checks if any account within the wallet is missing balance data.
 */
export const useIsLoadingBalancesForWallet = (wallet?: Wallet): boolean => {
  const accountsForWallet = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )
  const importedAccounts = useSelector(selectImportedAccounts)

  // The virtual "Imported" wallet groups all private-key accounts under one
  // card, but those accounts have real wallet UUIDs — not the virtual ID.
  const accounts =
    wallet?.id === IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID
      ? importedAccounts
      : accountsForWallet

  const { data } = useAllBalances()

  if (!wallet || accounts.length === 0) return true

  // Check if any account in this wallet is missing balance data
  return accounts.some(account => {
    const accountBalances = data[account.id]
    return !accountBalances || accountBalances.length === 0
  })
}
