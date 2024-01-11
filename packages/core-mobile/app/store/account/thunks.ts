import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from 'store'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import AccountsService from 'services/account/AccountsService'
import { captureEvent } from 'hooks/useAnalytics'
import {
  reducerName,
  selectAccounts,
  setAccount,
  setActiveAccountIndex
} from './slice'

export const addAccount = createAsyncThunk<void, void, ThunkApi>(
  `${reducerName}/addAccount`,
  async (_, thunkApi) => {
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    const accounts = selectAccounts(state)
    const accIndex = Object.keys(accounts).length
    const acc = await AccountsService.createNextAccount(
      isDeveloperMode,
      accIndex
    )

    thunkApi.dispatch(setAccount(acc))

    // update active account index
    thunkApi.dispatch(setActiveAccountIndex(acc.index))

    if (isDeveloperMode === false) {
      const allAccounts = [...Object.values(accounts), acc]

      thunkApi.dispatch(
        captureEvent('CollectAccountAddresses', {
          addresses: allAccounts.map(account => ({
            address: account.address,
            addressBtc: account.addressBtc,
            addressAVM: account.addressAVM ?? '',
            addressPVM: account.addressPVM ?? '',
            addressCoreEth: account.addressCoreEth ?? ''
          }))
        })
      )
    }
  }
)
