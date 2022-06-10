import { encrypt, getEncryptionKey } from 'screens/login/utils/EncryptionHelper'
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
  enterWallet: (mnemonic: string) => void
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

  const enterWallet = (mnemonic: string) => {
    initWalletWithMnemonic(mnemonic).then(_ =>
      appNavHook.navigateToRootWallet()
    )
  }

  /**
   * Inits wallet with Mnemonic phrase
   *
   * @param mnemonic
   */
  async function initWalletWithMnemonic(mnemonic: string) {
    walletService.setMnemonic(mnemonic)
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
  const key = await getEncryptionKey(pin)
  const encryptedData = await encrypt(mnemonic, key)
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
