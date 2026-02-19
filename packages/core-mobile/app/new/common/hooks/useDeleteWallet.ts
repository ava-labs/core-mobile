import { useRecentAccounts } from 'features/accountSettings/store'
import { useSwapActivitiesStore } from 'features/notifications/store'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { onLogOut } from 'store/app'
import { resetLoginAttempt } from 'store/security'

export const useDeleteWallet = (): {
  deleteWallet: () => void
} => {
  const { deleteRecentAccounts } = useRecentAccounts()
  const { clearAllSwapActivities } = useSwapActivitiesStore()
  const dispatch = useDispatch()

  const deleteWallet = useCallback(() => {
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
    deleteRecentAccounts()
    clearAllSwapActivities()
  }, [deleteRecentAccounts, clearAllSwapActivities, dispatch])

  return { deleteWallet }
}
