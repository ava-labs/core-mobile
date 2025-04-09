import { initWalletServiceAndUnlock } from 'hooks/useWallet'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import { WalletType } from 'services/wallet/types'
import { selectWalletState, selectWalletType, WalletState } from 'store/app'
import Logger from 'utils/Logger'

// This hook is used to initialize the seedless wallet and unlock it if the wallet state is inactive.
export const useInitWalletAndUnlock = (): {
  initWalletAndUnlock: () => Promise<void>
} => {
  const walletState = useSelector(selectWalletState)
  const dispatch = useDispatch()
  const walletType = useSelector(selectWalletType)

  const initWalletAndUnlock = useCallback(async () => {
    if (
      walletState === WalletState.INACTIVE &&
      walletType === WalletType.SEEDLESS
    ) {
      initWalletServiceAndUnlock({
        dispatch,
        mnemonic: SEEDLESS_MNEMONIC_STUB,
        walletType: WalletType.SEEDLESS,
        isLoggingIn: true
      }).catch(Logger.error)
    }
  }, [dispatch, walletState, walletType])

  return { initWalletAndUnlock }
}
