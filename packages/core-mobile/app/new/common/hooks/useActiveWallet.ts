import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'

export const useActiveWalletId = (): string => {
  const activeWalletId = useSelector(selectActiveWalletId)

  if (!activeWalletId) {
    throw new Error('No active wallet found.')
  }

  return activeWalletId
}
