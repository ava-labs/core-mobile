import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from 'store/types'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import AccountsService from 'services/account/AccountsService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectWalletType } from 'store/app/slice'
import { selectActiveNetwork } from 'store/network'
import { selectActiveWalletId } from 'store/wallet/slice'
import {
  reducerName,
  selectAccounts,
  selectActiveAccount,
  setAccount,
  setActiveAccountId
} from './slice'
import { getAccountIndex } from './utils'

export const addAccount = createAsyncThunk<void, void, ThunkApi>(
  `${reducerName}/addAccount`,
  async (_, thunkApi) => {
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)
    const activeNetwork = selectActiveNetwork(state)
    const activeAccount = selectActiveAccount(state)
    const walletType = selectWalletType(state)

    const accounts = selectAccounts(state)
    const accIndex = Object.keys(accounts).length
    const activeAccountIndex = activeAccount
      ? getAccountIndex(activeAccount)
      : 0
    const activeWalletId = selectActiveWalletId(state)

    if (!activeWalletId) {
      throw new Error('Active wallet ID is not set')
    }
    const acc = await AccountsService.createNextAccount({
      index: accIndex,
      activeAccountIndex,
      walletType,
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
          addressCoreEth: account.addressCoreEth ?? ''
        }))
      })
    }
  }
)
