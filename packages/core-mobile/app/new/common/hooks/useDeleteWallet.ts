import { useRecentAccounts } from 'features/accountSettings/store'
import { useWallet } from 'hooks/useWallet'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { onLogOut } from 'store/app'
import { resetLoginAttempt } from 'store/security'

export const useDeleteWallet = (): {
  deleteWallet: () => void
} => {
  const { deleteRecentAccounts } = useRecentAccounts()
  const { destroyWallet } = useWallet()
  const dispatch = useDispatch()

  const deleteWallet = useCallback(() => {
    destroyWallet()
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
    deleteRecentAccounts()
  }, [deleteRecentAccounts, dispatch, destroyWallet])

  return { deleteWallet }
}
