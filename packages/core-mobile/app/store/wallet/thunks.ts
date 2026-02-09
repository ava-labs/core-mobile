import { CoreAccountType } from '@avalabs/types'
import { createAsyncThunk } from '@reduxjs/toolkit'
import AccountsService from 'services/account/AccountsService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import {
  Account,
  ImportedAccount,
  setAccount,
  setActiveAccount
} from 'store/account'
import {
  removeAccount,
  selectAccountsByWalletId,
  setActiveAccountId
} from 'store/account/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ThunkApi } from 'store/types'
import { reducerName, selectWallets, setActiveWallet } from 'store/wallet/slice'
import { StoreWalletParams, Wallet } from 'store/wallet/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { uuid } from 'utils/uuid'
import { _removeWallet, selectActiveWalletId } from './slice'
import { generateWalletName } from './utils'

export const storeWallet = createAsyncThunk<
  Wallet,
  StoreWalletParams,
  ThunkApi
>(
  `${reducerName}/storeWallet`,
  async (
    { walletId, walletSecret, type, name }: StoreWalletParams,
    thunkApi
  ) => {
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
      name: name || generateWalletName(walletCount + 1),
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

    const addresses = await AccountsService.getAddresses({
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
  { mnemonic: string; name?: string },
  ThunkApi
>(
  `${reducerName}/importMnemonicWalletAndAccount`,
  async ({ mnemonic, name }, thunkApi) => {
    const dispatch = thunkApi.dispatch
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    const newWalletId = uuid()

    const walletType = WalletType.MNEMONIC
    await dispatch(
      storeWallet({
        walletId: newWalletId,
        name,
        walletSecret: mnemonic,
        type: walletType
      })
    ).unwrap()

    thunkApi.dispatch(setActiveWallet(newWalletId))

    const accountIndex = 0
    const addresses = await AccountsService.getAddresses({
      walletId: newWalletId,
      walletType,
      accountIndex,
      isTestnet: isDeveloperMode
    })

    const newAccountId = uuid()
    const newAccount: Account = {
      id: newAccountId,
      walletId: newWalletId,
      name: `Account 1`,
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
      walletType
    })
  }
)

// Wait duration to ensure Redux persist has flushed state to storage.
// This must be greater than STORAGE_WRITE_THROTTLE (200ms) in store/index.ts
// to prevent race conditions between state persistence and keychain operations.
const PERSIST_FLUSH_DELAY_MS = 250

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

    // Step 1: Update all Redux state first (before any keychain operations)
    const accountsToRemove = selectAccountsByWalletId(stateBefore, walletId)
    accountsToRemove.forEach(account => {
      thunkApi.dispatch(removeAccount(account.id))
    })
    thunkApi.dispatch(_removeWallet(walletId))

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

      const accountsForWallet = selectAccountsByWalletId(
        stateAfter,
        newActiveWalletId
      )
      if (accountsForWallet.length > 0 && accountsForWallet[0]) {
        thunkApi.dispatch(setActiveAccountId(accountsForWallet[0].id))
      }
    }

    // Step 2: Wait for Redux persist to flush the state to storage.
    // This prevents a race condition where:
    // - The keychain secret is deleted immediately
    // - But Redux state hasn't been persisted yet (due to 200ms throttle)
    // - If the user kills the app before persist completes, the old state
    //   (with the deleted wallet as active) would be restored on next launch
    // - The PIN screen would then fail to load the deleted wallet's secret
    await new Promise(resolve => setTimeout(resolve, PERSIST_FLUSH_DELAY_MS))

    // Step 3: Safe to remove the keychain secret
    await BiometricsSDK.removeWalletSecret(walletId)
  }
)
