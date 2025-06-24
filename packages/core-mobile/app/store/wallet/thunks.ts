import { CoreAccountType } from '@avalabs/types'
import { createAsyncThunk } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import {
  Account,
  ImportedAccount,
  setAccount,
  setActiveAccount
} from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { ThunkApi } from 'store/types'
import { reducerName, selectWallets, setActiveWallet } from 'store/wallet/slice'
import { StoreWalletParams, Wallet } from 'store/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { uuid } from 'utils/uuid'
import WalletService from 'services/wallet/WalletService'
import { generateWalletName } from './utils'

export const storeWallet = createAsyncThunk<
  Wallet,
  StoreWalletParams,
  ThunkApi
>(
  `${reducerName}/storeWallet`,
  async ({ walletId, walletSecret, type }: StoreWalletParams, thunkApi) => {
    const success = await BiometricsSDK.storeWalletSecret(
      walletId,
      walletSecret
    )

    if (!success) {
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

export const importPrivateKeyWalletAndAccount = createAsyncThunk<
  void,
  { accountDetails: ImportedAccount; accountSecret: string },
  ThunkApi
>(
  `${reducerName}/importPrivateKeyWalletAndAccount`,
  async ({ accountDetails, accountSecret }, thunkApi) => {
    const dispatch = thunkApi.dispatch
    const newWalletId = uuid()

    await dispatch(
      storeWallet({
        walletId: newWalletId,
        walletSecret: accountSecret,
        type: WalletType.PRIVATE_KEY
      })
    ).unwrap()

    thunkApi.dispatch(setActiveWallet(newWalletId))

    const accountToImport: ImportedAccount = {
      ...accountDetails,
      walletId: newWalletId
    }

    thunkApi.dispatch(setAccount(accountToImport))
    thunkApi.dispatch(setActiveAccount(accountToImport.id))
  }
)

export const importMnemonicWalletAndAccount = createAsyncThunk<
  void,
  { mnemonic: string },
  ThunkApi
>(
  `${reducerName}/importMnemonicWalletAndAccount`,
  async ({ mnemonic }, thunkApi) => {
    const dispatch = thunkApi.dispatch
    const state = thunkApi.getState()
    const activeNetwork = selectActiveNetwork(state)

    const newWalletId = uuid()

    await dispatch(
      storeWallet({
        walletId: newWalletId,
        walletSecret: mnemonic,
        type: WalletType.MNEMONIC
      })
    ).unwrap()

    thunkApi.dispatch(setActiveWallet(newWalletId))

    const accountIndex = 0
    const addresses = await WalletService.getAddresses({
      walletId: newWalletId,
      walletType: WalletType.MNEMONIC,
      accountIndex,
      network: activeNetwork
    })

    const newAccountId = uuid()
    const newAccount: Account = {
      id: newAccountId,
      walletId: newWalletId,
      name: `Account ${accountIndex + 1}`,
      type: CoreAccountType.PRIMARY,
      index: accountIndex,
      addressC: addresses.EVM,
      addressBTC: addresses.BITCOIN,
      addressAVM: addresses.AVM,
      addressPVM: addresses.PVM,
      addressSVM: addresses.SVM,
      addressCoreEth: addresses.CoreEth
    }

    dispatch(setAccount(newAccount))
    dispatch(setActiveAccount(newAccountId))

    AnalyticsService.capture('MnemonicWalletImported', {
      walletType: WalletType.MNEMONIC
    })
  }
)
