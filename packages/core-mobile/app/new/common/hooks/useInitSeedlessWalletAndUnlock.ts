import { initWalletServiceAndUnlock } from 'hooks/useWallet'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { selectWalletState, selectWalletType, WalletState } from 'store/app'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'

// This hook is used to initialize the seedless wallet and unlock it if the wallet state is inactive.
export const useInitSeedlessWalletAndUnlock = (): {
  initSeedlessWalletAndUnlock: () => Promise<void>
} => {
  const walletState = useSelector(selectWalletState)
  const dispatch = useDispatch()
  const walletType = useSelector(selectWalletType)

  const initSeedlessWalletAndUnlock = useCallback(async () => {
    if (
      walletState === WalletState.INACTIVE &&
      walletType === WalletType.SEEDLESS
    ) {
      initWalletServiceAndUnlock({
        dispatch,
        mnemonic: uuid(),
        walletType: WalletType.SEEDLESS,
        isLoggingIn: true
      }).catch(Logger.error)
    }
  }, [dispatch, walletState, walletType])

  return { initSeedlessWalletAndUnlock }
}
