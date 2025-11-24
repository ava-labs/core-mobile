import { Account } from 'store/account'

export function getIsActiveWallet(
  id: string,
  activeAccount?: Account
): boolean {
  if (!activeAccount) {
    return false
  }
  return id === activeAccount.walletId
}
