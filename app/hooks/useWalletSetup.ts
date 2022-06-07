import { encrypt, getEncryptionKey } from 'screens/login/utils/EncryptionHelper'
import BiometricsSDK from 'utils/BiometricsSDK'
import { AppNavHook } from 'useAppNav'
import { walletServiceInstance } from 'services/wallet/WalletService'
import { useDispatch, useSelector } from 'react-redux'
import {
  addAccount as addAccountToStore,
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/accounts'
import { createNextAccount } from 'services/accounts/AccountsService'
import {
  useAccountsContext,
  useWalletContext
} from '@avalabs/wallet-react-components'

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
  const walletContext2 = useWalletContext()
  const { addAccount: addAccount2, activateAccount: activateAccount2 } =
    useAccountsContext()
  const accounts = useSelector(selectAccounts)
  const activeAccount = useSelector(selectActiveAccount)
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
    await walletContext2.initWalletMnemonic(mnemonic)
    walletServiceInstance.setMnemonic(mnemonic)
    if (Object.keys(accounts).length === 0) {
      const acc = await createNextAccount(walletServiceInstance, accounts)
      dispatch(addAccountToStore(acc))
      dispatch(setActiveAccountIndex(acc.index))

      //fixme to be removed after ditching wallet-react-components
      const acc2 = addAccount2()
      activateAccount2(acc2.index)
    } else {
      Object.values(accounts).forEach(account => {
        //fixme to be removed after ditching wallet-react-components
        const acc2 = addAccount2()
        if (account.index === activeAccount?.index) {
          activateAccount2(acc2.index)
        }
      })
    }
  }

  /**
   * Destroys the wallet instance
   */
  async function destroyWallet() {
    walletServiceInstance.destroy()
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
