import { createAsyncThunk } from '@reduxjs/toolkit'
import BiometricsSDK from 'utils/BiometricsSDK'
import { reducerName, selectWallets } from 'store/wallet/slice'
import { StoreWalletWithPinParams, Wallet } from 'store/wallet/types'
import { ThunkApi } from 'store/types'
import { Account, ImportedAccount } from 'store/account/types'
import { WalletType } from 'services/wallet/types'
import { setAccount, setActiveAccount } from 'store/account'
import { uuid } from 'utils/uuid'
import { WalletType as CoreWalletType, CoreAccountType } from '@avalabs/types'
import WalletService from 'services/wallet/WalletService'
import { selectActiveNetwork } from 'store/network'
import { encrypt } from 'utils/EncryptionHelper'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletInitializer from 'services/wallet/WalletInitializer'
import { StorageKey } from 'resources/Constants'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'
import { generateWalletName } from './utils'

/**
 * Stores the wallet with PIN encryption, returns the wallet object. The wallet is automatically
 * stored in the Redux store on successful completion via a listener in wallet/slice.ts.
 *
 * @param walletId - the ID of the wallet to store
 * @param walletSecret - the secret of the wallet to store
 * @param isResetting - whether the wallet is being reset
 * @param type - the type of the wallet to store
 */
export const storeWalletWithPin = createAsyncThunk<
  Wallet,
  StoreWalletWithPinParams,
  ThunkApi
>(
  `${reducerName}/storeWalletWithPin`,
  async (
    { walletId, walletSecret, isResetting, type }: StoreWalletWithPinParams,
    thunkApi
  ) => {
    const result = await BiometricsSDK.storeWalletWithPin(
      walletId,
      walletSecret,
      isResetting
    )

    if (!result) {
      throw new Error('Failed to store wallet in BiometricsSDK')
    }

    const state = thunkApi.getState()
    const walletCount = Object.keys(selectWallets(state)).length

    return {
      id: walletId,
      name: generateWalletName(type, walletCount + 1),
      isActive: true,
      type
    }
  }
)

export const importPrivateKeyAccountAndCreateWallet = createAsyncThunk<
  void,
  { accountDetails: ImportedAccount; accountSecret: string; pin: string },
  ThunkApi
>(
  `${reducerName}/importPrivateKeyAccountAndCreateWallet`,
  async ({ accountDetails, accountSecret, pin }, thunkApi) => {
    const newWalletId = uuid()

    // Store the private key with PIN encryption
    const accountSecretEncrypted = await encrypt(accountSecret, pin)
    await thunkApi
      .dispatch(
        storeWalletWithPin({
          walletId: newWalletId,
          walletSecret: accountSecretEncrypted,
          type: WalletType.PRIVATE_KEY
        })
      )
      .unwrap()

    // If biometric auth is enabled, also store with biometry
    const authType = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (authType === 'BIO') {
      const result = await BiometricsSDK.storeWalletWithBiometry(
        newWalletId,
        accountSecret
      )
      if (!result) {
        Logger.error('Failed to store wallet with biometry')
      }
    }

    const accountToImport: ImportedAccount = {
      ...accountDetails,
      walletId: newWalletId,
      active: true
    }

    thunkApi.dispatch(setAccount(accountToImport))
    thunkApi.dispatch(setActiveAccount(accountToImport.id))
  }
)

export const importMnemonicWalletAndAccount = createAsyncThunk<
  void,
  { mnemonic: string; pin: string },
  ThunkApi
>(
  `${reducerName}/importMnemonicWalletAndAccount`,
  async ({ mnemonic, pin }, thunkApi) => {
    const dispatch = thunkApi.dispatch
    const state = thunkApi.getState()
    const activeNetwork = selectActiveNetwork(state)

    const newWalletId = uuid()

    const newWalletSecret = await encrypt(mnemonic, pin)
    if (!newWalletSecret) {
      throw new Error('Failed to encrypt new mnemonic with PIN')
    }

    const newWallet = await dispatch(
      storeWalletWithPin({
        walletId: newWalletId,
        walletSecret: newWalletSecret,
        isResetting: false,
        type: WalletType.MNEMONIC
      })
    ).unwrap()

    const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (type === 'BIO') {
      await BiometricsSDK.storeWalletWithBiometry(newWalletId, mnemonic)
    } else {
      Logger.error('Secure access type not found')
    }

    await WalletInitializer.initialize({
      walletSecret: mnemonic,
      walletType: WalletType.MNEMONIC,
      isLoggingIn: true
    })

    const accountIndex = 0
    const addresses = await WalletService.getAddresses(0, activeNetwork)

    const newAccountId = uuid()
    const newAccount: Account = {
      id: newAccountId,
      walletId: newWalletId,
      name: `Account ${accountIndex + 1}`,
      type: CoreAccountType.PRIMARY,
      walletType: CoreWalletType.Mnemonic,
      index: accountIndex,
      active: true,
      addressC: addresses.EVM,
      addressBTC: addresses.BITCOIN,
      addressAVM: addresses.AVM,
      addressPVM: addresses.PVM,
      addressCoreEth: addresses.CoreEth,
      walletName: newWallet.name
    }

    dispatch(setAccount(newAccount))
    dispatch(setActiveAccount(newAccountId))

    AnalyticsService.capture('MnemonicWalletImported', {
      walletType: WalletType.MNEMONIC
    })
  }
)
