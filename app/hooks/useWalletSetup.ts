import { encrypt } from 'utils/EncryptionHelper'
import BiometricsSDK from 'utils/BiometricsSDK'
import { AppNavHook } from 'useAppNav'
import walletService from 'services/wallet/WalletService'
import { useDispatch, useSelector } from 'react-redux'
import { addAccount, selectAccounts } from 'store/account'

export interface WalletSetupHook {
  onPinCreated: (
    mnemonic: string,
    pin: string,
    isResetting: boolean
  ) => Promise<'useBiometry' | 'enterWallet'>
  enterWallet: (mnemonic: string) => Promise<void>
  destroyWallet: () => void
}

/**
 * This hook handles onboarding process.
 * onPinCreated - use when user sets PIN to encrypt mnemonic end see if
 * user has biometry turned on
 * enterWallet - use when ready to enter the wallet
 * destroyWallet - call when user ends session
 */
export function useWalletSetup(appNavHook: AppNavHook): WalletSetupHook {
  const accounts = useSelector(selectAccounts)
  const dispatch = useDispatch()

  const enterWallet = async (mnemonic: string) => {
    await initWalletWithMnemonic(mnemonic)
    setTimeout(() => {
      appNavHook.navigateToRootWallet()
    }, 300)
  }

  /**
   * Inits wallet with Mnemonic phrase
   *
   * @param mnemonic
   */
  async function initWalletWithMnemonic(mnemonic: string) {
    await walletService.setMnemonic(mnemonic)
    if (Object.keys(accounts).length === 0) {
      dispatch(addAccount())
    }
  }

  /**
   * Destroys the wallet instance
   */
  async function destroyWallet() {
    walletService.destroy()
  }

  return {
    onPinCreated,
    enterWallet,
    destroyWallet
  }
}

async function onPinCreated(
  mnemonic: string,
  pin: string,
  isResetting = false
): Promise<'useBiometry' | 'enterWallet'> {
  const encryptedData = await encrypt(mnemonic, pin)
  const pinSaved = await BiometricsSDK.storeWalletWithPin(
    encryptedData,
    isResetting
  )
  if (pinSaved === false) {
    throw Error('Pin not saved')
  }
  const canUseBiometry = isResetting
    ? false
    : await BiometricsSDK.canUseBiometry()

  if (canUseBiometry) {
    return Promise.resolve('useBiometry')
  } else {
    return Promise.resolve('enterWallet')
  }
}
