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
  const dispatch = useDispatch()
  const { resetLedgerWalletMap } = useLedgerWalletMap()

  const deleteWallet = useCallback(() => {
    // Fusion transfers and stake notification records are cleared by the
    // onLogOut listener (see store/app/listeners), which also covers forced
    // logouts that don't go through this hook.
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
    deleteRecentAccounts()
    resetLedgerWalletMap()
  }, [deleteRecentAccounts, dispatch, resetLedgerWalletMap])

  return { deleteWallet }
}
