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
import { addWallet, setActiveWallet } from './slice'
import { generateWalletName } from './utils'

export const storeWalletWithPin = createAsyncThunk<
  Wallet,
  StoreWalletWithPinParams,
  ThunkApi
>(
  `${reducerName}/storeWalletWithPin`,
  async (
    {
      walletId,
      encryptedWalletKey,
      isResetting,
      type
    }: StoreWalletWithPinParams,
    thunkApi
  ) => {
    const result = await BiometricsSDK.storeWalletWithPin(
      walletId,
      encryptedWalletKey,
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
      type
    }
  }
)

export const importPrivateKeyAccountAndCreateWallet = createAsyncThunk<
  void,
  { accountDetails: ImportedAccount },
  ThunkApi
>(
  `${reducerName}/importPrivateKeyAccountAndCreateWallet`,
  async ({ accountDetails }, thunkApi) => {
    const newWalletId = uuid()
    const state = thunkApi.getState()
    const wallets = selectWallets(state)
    const walletCount = Object.keys(wallets).length
    const newWalletName = generateWalletName(
      WalletType.PRIVATE_KEY,
      walletCount + 1
    )

    const newWallet: Wallet = {
      id: newWalletId,
      name: newWalletName,
      type: WalletType.PRIVATE_KEY
    }

    thunkApi.dispatch(addWallet(newWallet))
    thunkApi.dispatch(setActiveWallet(newWalletId))

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
    const wallets = selectWallets(state)
    const walletCount = Object.keys(wallets).length
    const activeNetwork = selectActiveNetwork(state)

    const newWalletId = uuid()
    const newWalletName = generateWalletName(
      WalletType.MNEMONIC,
      walletCount + 1
    )

    const newWalletSecret = await encrypt(mnemonic, pin)
    if (!newWalletSecret) {
      throw new Error('Failed to encrypt new mnemonic with PIN')
    }

    await dispatch(
      storeWalletWithPin({
        walletId: newWalletId,
        walletSecret: newWalletSecret,
        isResetting: false,
        type: WalletType.MNEMONIC
      })
    ).unwrap()

    const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (type === 'BIO') {
      BiometricsSDK.storeWalletWithBiometry(newWalletId, mnemonic)
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
      walletName: newWalletName
    }

    dispatch(setAccount(newAccount))
    dispatch(setActiveAccount(newAccountId))

    AnalyticsService.capture('MnemonicWalletImported', {
      walletType: WalletType.MNEMONIC
    })
  }
)
