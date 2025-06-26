import { createAsyncThunk } from '@reduxjs/toolkit'
import AccountsService from 'services/account/AccountsService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { ThunkApi } from 'store/types'
import {
  selectActiveWalletId,
  selectWalletById,
  setActiveWallet
} from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import {
  reducerName,
  selectAccountById,
  selectAccounts,
  selectAccountsByWalletId,
  setAccount,
  setActiveAccountId,
  removeAccount,
  selectActiveAccount
} from './slice'

export const addAccount = createAsyncThunk<void, string, ThunkApi>(
  `${reducerName}/addAccount`,
  async (walletId, thunkApi) => {
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)
    const allAccounts = selectAccounts(state)

    const wallet = selectWalletById(walletId)(state)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const allAccountsCount = Object.keys(allAccounts).length
    const accountsByWalletId = selectAccountsByWalletId(walletId)(state)

    const acc = await AccountsService.createNextAccount({
      name: `Account ${allAccountsCount + 1}`,
      index: Object.keys(accountsByWalletId).length,
      walletType: wallet.type,
      isTestnet: isDeveloperMode,
      walletId: walletId
    })

    thunkApi.dispatch(setAccount(acc))
    thunkApi.dispatch(setActiveAccountId(acc.id))

    if (isDeveloperMode === false) {
      const allAccountsByWalletId = [...Object.values(accountsByWalletId), acc]

      AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
        addresses: allAccountsByWalletId.map(account => ({
          address: account.addressC,
          addressBtc: account.addressBTC,
          addressAVM: account.addressAVM ?? '',
          addressPVM: account.addressPVM ?? '',
          addressCoreEth: account.addressCoreEth ?? '',
          addressSVM: account.addressSVM ?? ''
        }))
      })
    }
  }
)

export const removeAccountWithActiveCheck = createAsyncThunk<
  void,
  string,
  ThunkApi
>(
  `${reducerName}/removeAccountWithActiveCheck`,
  async (accountId, thunkApi) => {
    const state = thunkApi.getState()
    const accountToRemove = selectAccountById(accountId)(state)
    const activeAccount = selectActiveAccount(state)
    const wallet = selectWalletById(accountToRemove?.walletId ?? '')(state)

    if (!accountToRemove) {
      throw new Error(`Account with ID "${accountId}" not found`)
    }

    const accountsInWallet = selectAccountsByWalletId(accountToRemove.walletId)(
      state
    )

    // Validate removal eligibility
    const isLastAccount =
      accountToRemove.index ===
      Math.max(...accountsInWallet.map(acc => acc.index))
    if (!isLastAccount || accountsInWallet.length <= 1) {
      throw new Error(
        'Account cannot be removed: not the last account or only account in wallet'
      )
    }

    // If removing the active account, set the previous account as active
    if (activeAccount?.id === accountId) {
      const previousAccount = accountsInWallet[accountsInWallet.length - 2] // Second to last
      if (previousAccount) {
        thunkApi.dispatch(setActiveAccountId(previousAccount.id))
      }
    }

    if (wallet?.type === WalletType.SEEDLESS) {
      await SeedlessPubKeysStorage.removePublicKeysByIndex(
        accountToRemove.index
      )
    }

    // Remove the account
    thunkApi.dispatch(removeAccount(accountId))
  }
)

export const setActiveAccount = createAsyncThunk<void, string, ThunkApi>(
  `${reducerName}/setActiveAccount`,
  async (accountId, thunkApi) => {
    const state = thunkApi.getState()
    const account = selectAccountById(accountId)(state)

    if (!account) {
      throw new Error(`Account with ID "${accountId}" not found`)
    }

    const activeWalletId = selectActiveWalletId(state)

    // If account is from a different wallet, set that wallet as active first
    if (account.walletId !== activeWalletId) {
      thunkApi.dispatch(setActiveWallet(account.walletId))
    }

    // Then set the active account
    thunkApi.dispatch(setActiveAccountId(accountId))
  }
)
