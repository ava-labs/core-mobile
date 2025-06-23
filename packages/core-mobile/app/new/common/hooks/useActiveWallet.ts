import { useSelector } from 'react-redux'
import { selectActiveWalletId, selectWalletById } from 'store/wallet/slice'
import { Wallet } from 'store/wallet/types'

export const useActiveWalletId = (): string => {
  const activeWalletId = useSelector(selectActiveWalletId)

  if (!activeWalletId) {
    throw new Error('No active wallet found.')
  }

  return activeWalletId
}

export const useActiveWallet = (): Wallet => {
  const activeWalletId = useActiveWalletId()
  const wallet = useSelector(selectWalletById(activeWalletId))

  if (!wallet) {
    throw new Error('No active wallet found.')
  }

  return wallet
}
