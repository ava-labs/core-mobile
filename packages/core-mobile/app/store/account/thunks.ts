import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from 'store/types'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import AccountsService from 'services/account/AccountsService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectWalletType } from 'store/app/slice'
import { selectActiveNetwork } from 'store/network'
import {
  reducerName,
  selectAccounts,
  selectActiveAccount,
  setAccount,
  setActiveAccountIndex
} from './slice'

export const addAccount = createAsyncThunk<void, void, ThunkApi>(
  `${reducerName}/addAccount`,
  async (_, thunkApi) => {
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)
    const activeNetwork = selectActiveNetwork(state)
    const activeAccountIndex = selectActiveAccount(state)?.index ?? 0
    const walletType = selectWalletType(state)

    const accounts = selectAccounts(state)
    const accIndex = Object.keys(accounts).length
    const acc = await AccountsService.createNextAccount({
      index: accIndex,
      activeAccountIndex,
      walletType,
      network: activeNetwork
    })

    thunkApi.dispatch(setAccount(acc))

    // update active account index
    thunkApi.dispatch(setActiveAccountIndex(acc.index))

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
