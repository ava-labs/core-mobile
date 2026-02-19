import { useRecentAccounts } from 'features/accountSettings/store'
import { useLedgerWalletMap } from 'features/ledger/store'
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
  const { resetLedgerWalletMap } = useLedgerWalletMap()

  const deleteWallet = useCallback(() => {
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
    deleteRecentAccounts()
    resetLedgerWalletMap()
    clearAllSwapActivities()
  }, [
    deleteRecentAccounts,
    dispatch,
    resetLedgerWalletMap,
    clearAllSwapActivities
  ])

  return { deleteWallet }
}
