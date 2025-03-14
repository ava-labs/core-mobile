import { useWallet } from 'hooks/useWallet'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { onLogOut } from 'store/app'
import { resetLoginAttempt } from 'store/security'

export const useDeleteWallet = (): {
  deleteWallet: () => void
} => {
  const { destroyWallet } = useWallet()
  const dispatch = useDispatch()

  const deleteWallet = useCallback(() => {
    destroyWallet()
    dispatch(onLogOut())
    dispatch(resetLoginAttempt())
  }, [dispatch, destroyWallet])

  return { deleteWallet }
}
