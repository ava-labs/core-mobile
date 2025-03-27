import { createAsyncThunk } from '@reduxjs/toolkit'
import BiometricsSDK from 'utils/BiometricsSDK'
import { reducerName, selectWallets } from 'store/wallet/slice'
import { StoreWalletWithPinParams, Wallet } from 'store/wallet/types'
import { ThunkApi } from 'store/index'
import { generateWalletName } from './utils'

export const storeWalletWithPin = createAsyncThunk<
  Wallet,
  StoreWalletWithPinParams,
  ThunkApi
>(
  `${reducerName}/storeWalletWithPin`,
  async (
    {
      walletId,
      encryptedWalletKey,
      isResetting,
      type
    }: StoreWalletWithPinParams,
    thunkApi
  ) => {
    const result = await BiometricsSDK.storeWalletWithPin(
      walletId,
      encryptedWalletKey,
      isResetting
    )

    if (!result) {
      throw new Error('Failed to store wallet in BiometricsSDK')
    }

    const state = thunkApi.getState()
    const walletCount = Object.keys(selectWallets(state)).length

    return {
      id: walletId,
      name: generateWalletName(type, walletCount + 1),
      mnemonic: encryptedWalletKey,
      type
    }
  }
)
