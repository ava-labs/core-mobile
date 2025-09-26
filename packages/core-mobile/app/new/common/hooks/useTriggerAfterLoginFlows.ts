import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectWalletState, WalletState } from 'store/app'
import { afterLoginFlowsRequested } from 'store/notifications'

export const useTriggerAfterLoginFlows = (): void => {
  const dispatch = useDispatch()
  const walletState = useSelector(selectWalletState)
  const activeAccount = useSelector(selectActiveAccount)

  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (walletState !== WalletState.ACTIVE) return
    if (!activeAccount) return

    firedRef.current = true
    dispatch(afterLoginFlowsRequested())
  }, [walletState, activeAccount, dispatch])
}
