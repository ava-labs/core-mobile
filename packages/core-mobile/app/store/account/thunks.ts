import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from 'store/types'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import AccountsService from 'services/account/AccountsService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveNetwork } from 'store/network'
import {
  selectActiveWalletId,
  selectWalletById,
  setActiveWallet
} from 'store/wallet/slice'
import {
  reducerName,
  selectAccountById,
  setAccount,
  setActiveAccountId,
  selectAccountsByWalletId
} from './slice'

export const addAccount = createAsyncThunk<void, void, ThunkApi>(
  `${reducerName}/addAccount`,
  async (_, thunkApi) => {
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)
    const activeNetwork = selectActiveNetwork(state)
    const activeWalletId = selectActiveWalletId(state)
    if (!activeWalletId) {
      throw new Error('Active wallet ID is not set')
    }
    const wallet = selectWalletById(activeWalletId)(state)
    if (!wallet) {
      throw new Error('Wallet not found')
    }
    const accounts = selectAccountsByWalletId(activeWalletId)(state)
    const accIndex = Object.keys(accounts).length

    const acc = await AccountsService.createNextAccount({
      index: accIndex,
      walletType: wallet.type,
      network: activeNetwork,
      walletId: activeWalletId
    })

    thunkApi.dispatch(setAccount(acc))
    thunkApi.dispatch(setActiveAccountId(acc.id))

    if (isDeveloperMode === false) {
      const allAccounts = [...Object.values(accounts), acc]

      AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
        addresses: allAccounts.map(account => ({
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
