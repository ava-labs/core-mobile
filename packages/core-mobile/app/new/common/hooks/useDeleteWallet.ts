import { useRecentAccounts } from 'features/accountSettings/store'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { onLogOut } from 'store/app'
import { resetLoginAttempt } from 'store/security'

export const useDeleteWallet = (): {
  deleteWallet: () => void
} => {
  const { deleteRecentAccounts } = useRecentAccounts()
  const dispatch = useDispatch()

  const deleteWallet = useCallback(() => {
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
    deleteRecentAccounts()
  }, [deleteRecentAccounts, dispatch])

  return { deleteWallet }
}
