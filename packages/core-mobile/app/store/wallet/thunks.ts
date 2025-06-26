import { CoreAccountType } from '@avalabs/types'
import { createAsyncThunk } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import {
  Account,
  ImportedAccount,
  selectAccounts,
  setAccount,
  setActiveAccount
} from 'store/account'
import { ThunkApi } from 'store/types'
import { reducerName, selectWallets, setActiveWallet } from 'store/wallet/slice'
import { StoreWalletParams, Wallet } from 'store/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { uuid } from 'utils/uuid'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  removeAccount,
  selectAccountsByWalletId,
  setActiveAccountId
} from 'store/account/slice'
import { generateWalletName } from './utils'
import { _removeWallet, selectActiveWalletId } from './slice'

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
      name: generateWalletName(walletCount + 1),
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
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    const newWalletId = uuid()

    await dispatch(
      storeWallet({
        walletId: newWalletId,
        walletSecret: accountSecret,
        type: WalletType.PRIVATE_KEY
      })
    ).unwrap()

    thunkApi.dispatch(setActiveWallet(newWalletId))

    const addresses = await WalletService.getAddresses({
      walletId: newWalletId,
      walletType: WalletType.PRIVATE_KEY,
      isTestnet: isDeveloperMode
    })

    const accountToImport: ImportedAccount = {
      ...accountDetails,
      walletId: newWalletId,
      addressC: addresses.EVM,
      addressBTC: addresses.BITCOIN,
      addressAVM: addresses.AVM,
      addressPVM: addresses.PVM,
      addressSVM: addresses.SVM,
      addressCoreEth: addresses.CoreEth
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
    const isDeveloperMode = selectIsDeveloperMode(state)

    const newWalletId = uuid()

    await dispatch(
      storeWallet({
        walletId: newWalletId,
        walletSecret: mnemonic,
        type: WalletType.MNEMONIC
      })
    ).unwrap()

    thunkApi.dispatch(setActiveWallet(newWalletId))

    const allAccounts = selectAccounts(state)
    const allAccountsCount = Object.keys(allAccounts).length

    const addresses = await WalletService.getAddresses({
      walletId: newWalletId,
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      isTestnet: isDeveloperMode
    })

    const newAccountId = uuid()
    const newAccount: Account = {
      id: newAccountId,
      walletId: newWalletId,
      name: `Account ${allAccountsCount + 1}`,
      type: CoreAccountType.PRIMARY,
      index: 0,
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

export const removeWallet = createAsyncThunk<void, string, ThunkApi>(
  'wallet/removeWallet',
  async (walletId, thunkApi) => {
    const stateBefore = thunkApi.getState()
    const activeWalletIdBefore = selectActiveWalletId(stateBefore)
    if (!activeWalletIdBefore) {
      throw new Error('No active wallet found')
    }
    const activeWalletsIndexBefore = Object.keys(
      selectWallets(stateBefore)
    ).indexOf(activeWalletIdBefore)

    const accountsToRemove = selectAccountsByWalletId(walletId)(stateBefore)
    accountsToRemove.forEach(account => {
      thunkApi.dispatch(removeAccount(account.id))
    })
    thunkApi.dispatch(_removeWallet(walletId))
    await BiometricsSDK.removeWalletSecret(walletId)

    // If we removed the active wallet, set the first account of the new active wallet as active
    if (activeWalletIdBefore === walletId) {
      const stateAfter = thunkApi.getState()
      const newActiveWalletsIndex = Math.max(activeWalletsIndexBefore - 1, 0)
      const newActiveWalletId = Object.keys(selectWallets(stateAfter))[
        newActiveWalletsIndex
      ]
      if (!newActiveWalletId) {
        throw new Error('No active wallet found')
      }
      thunkApi.dispatch(setActiveWallet(newActiveWalletId))

      const accountsForWallet =
        selectAccountsByWalletId(newActiveWalletId)(stateAfter)
      if (accountsForWallet.length > 0 && accountsForWallet[0]) {
        thunkApi.dispatch(setActiveAccountId(accountsForWallet[0].id))
      }
    }
  }
)
