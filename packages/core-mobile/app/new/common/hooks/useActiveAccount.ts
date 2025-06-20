import { useSelector } from 'react-redux'
import { Account, selectActiveAccount } from 'store/account'

export const useActiveAccount = (): Account => {
  const activeAccount = useSelector(selectActiveAccount)

  if (!activeAccount) {
    throw new Error('No active account found.')
  }

  return activeAccount
}
