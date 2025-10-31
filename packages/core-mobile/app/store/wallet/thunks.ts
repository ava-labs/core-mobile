import { CoreAccountType } from '@avalabs/types'
import { createAsyncThunk } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import {
  Account,
  AccountCollection,
  ImportedAccount,
  selectAccounts,
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
  selectPlatformAccountsByWalletId,
  setAccounts,
  setActiveAccountId
} from 'store/account/slice'
import AccountsService from 'services/account/AccountsService'
import { NetworkVMType } from '@avalabs/vm-module-types'
import {
  P_CHAIN_ACCOUNT_NAME,
  X_CHAIN_ACCOUNT_NAME
} from 'store/account/consts'
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
    const accounts: AccountCollection = {}
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
    accounts[accountToImport.id] = accountToImport

    // set platform accounts
    ;[NetworkVMType.AVM, NetworkVMType.PVM].forEach(networkType => {
      accounts[`${newWalletId}-${networkType}`] = {
        index: 0,
        id: `${newWalletId}-${networkType}`,
        walletId: newWalletId,
        name:
          networkType === NetworkVMType.PVM
            ? P_CHAIN_ACCOUNT_NAME
            : X_CHAIN_ACCOUNT_NAME,
        type: CoreAccountType.PRIMARY,
        addressC: '',
        addressBTC: '',
        addressAVM: '',
        addressPVM: '',
        addressCoreEth: '',
        addressSVM: '',
        addresses: [
          networkType === NetworkVMType.PVM ? addresses.PVM : addresses.AVM
        ]
      }
    })

    thunkApi.dispatch(setAccounts(accounts))
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
    const accounts: AccountCollection = {}
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
    const allAccountsCount = allAccounts.length

    const addresses = await AccountsService.getAddresses({
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
    accounts[newAccountId] = newAccount

    // set platform accounts
    ;[NetworkVMType.AVM, NetworkVMType.PVM].forEach(networkType => {
      accounts[`${newWalletId}-${networkType}`] = {
        index: 0,
        id: `${newWalletId}-${networkType}`,
        walletId: newWalletId,
        name:
          networkType === NetworkVMType.PVM
            ? P_CHAIN_ACCOUNT_NAME
            : X_CHAIN_ACCOUNT_NAME,
        type: CoreAccountType.PRIMARY,
        addressC: '',
        addressBTC: '',
        addressAVM: '',
        addressPVM: '',
        addressCoreEth: '',
        addressSVM: '',
        addresses: [
          networkType === NetworkVMType.PVM ? addresses.PVM : addresses.AVM
        ]
      }
    })

    dispatch(setAccounts(accounts))
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

    const accountsToRemove = [
      ...selectAccountsByWalletId(stateBefore, walletId),
      ...selectPlatformAccountsByWalletId(stateBefore, walletId)
    ]
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

      const accountsForWallet = selectAccountsByWalletId(
        stateAfter,
        newActiveWalletId
      )
      if (accountsForWallet.length > 0 && accountsForWallet[0]) {
        thunkApi.dispatch(setActiveAccountId(accountsForWallet[0].id))
      }
    }
  }
)
