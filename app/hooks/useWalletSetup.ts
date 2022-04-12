import {
  useAccountsContext,
  useWalletContext
} from '@avalabs/wallet-react-components'
import {Account} from 'dto/Account'
import {encrypt, getEncryptionKey} from 'screens/login/utils/EncryptionHelper'
import BiometricsSDK from 'utils/BiometricsSDK'
import {Repo} from 'Repo'
import {AppNavHook} from 'useAppNav'

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
 * setMnemonic - use for temporary storing mnemonic between onbaording
 * screens.
 * onPinCreated - use when user sets PIN to encrypt mnemonic end see if
 * user has biometry turned on
 * enterWallet - use when ready to enter the wallet
 */
export function useWalletSetup(
  repo: Repo,
  appNavHook: AppNavHook
): WalletSetupHook {
  const walletContext = useWalletContext()
  const accountsContext = useAccountsContext()

  const enterWallet = (mnemonic: string) => {
    initWalletWithMnemonic(mnemonic, repo.accountsRepo.accounts)
    appNavHook.navigateToRootWallet()
  }

  /**
   * Inits wallet with Mnemonic phrase,
   * adds account and set it as active.
   *
   * @param mnemonic
   * @param existingAccounts
   */
  function initWalletWithMnemonic(
    mnemonic: string,
    existingAccounts: Map<number, Account>
  ) {
    walletContext.initWalletMnemonic(mnemonic).then(() => {
      if (existingAccounts.size === 0) {
        const defaultAccounts = new Map()
        const newAccount = accountsContext.addAccount()
        accountsContext.activateAccount(newAccount.index)
        defaultAccounts.set(newAccount.index, <Account>{
          index: newAccount.index,
          title: `Account ${newAccount.index + 1}`,
          active: true,
          address: newAccount.wallet.getAddressC(),
          balance$: newAccount.balance$
        })
        repo.accountsRepo.saveAccounts(defaultAccounts)
      } else {
        for (let i = 0; i < existingAccounts.size; i++) {
          const newAccount = accountsContext.addAccount()
          const existingAccount = existingAccounts.get(newAccount.index)
          existingAccount!.balance$ = newAccount.balance$
          if (existingAccount!.active) {
            accountsContext.activateAccount(newAccount.index)
          }
        }
      }
    })
  }

  /**
   * Destroys the wallet instance
   */
  async function destroyWallet() {
    walletContext?.clearWallet()
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
