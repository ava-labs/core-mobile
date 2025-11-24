import { CoreAccountType } from '@avalabs/types'
import { Account } from 'store/account'
import { IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID } from './consts'

export function getIsActiveWallet(
  id: string,
  activeAccount?: Account
): boolean {
  if (!activeAccount) {
    return false
  }
  return (
    id === activeAccount.walletId ||
    (id === IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID &&
      activeAccount.type === CoreAccountType.IMPORTED)
  )
}
