import { createAsyncThunk } from '@reduxjs/toolkit'
import BiometricsSDK from 'utils/BiometricsSDK'
import { reducerName, selectWallets } from 'store/wallet/slice'
import { StoreWalletParams, Wallet } from 'store/wallet/types'
import { ThunkApi } from 'store/types'
import { generateWalletName } from './utils'

export const storeWallet = createAsyncThunk<
  Wallet,
  StoreWalletParams,
  ThunkApi
>(
  `${reducerName}/storeWallet`,
  async ({ walletId, walletSecret, type }: StoreWalletParams, thunkApi) => {
    const result = await BiometricsSDK.storeWalletSecret(walletId, walletSecret)

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
