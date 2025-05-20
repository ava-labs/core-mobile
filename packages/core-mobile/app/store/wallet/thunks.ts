import { createAsyncThunk } from '@reduxjs/toolkit'
import BiometricsSDK from 'utils/BiometricsSDK'
import { reducerName, selectWallets } from 'store/wallet/slice'
import { StoreWalletWithPinParams, Wallet } from 'store/wallet/types'
import { ThunkApi } from 'store/types'
import { ImportedAccount } from 'store/account/types'
import { WalletType } from 'services/wallet/types'
import { setAccount, setActiveAccount } from 'store/account'
import { uuid } from 'utils/uuid'
import { addWallet, setActiveWallet } from './slice'
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
      isActive: true,
      type
    }
  }
)

export const importPrivateKeyAccountAndCreateWallet = createAsyncThunk<
  void,
  { accountDetails: ImportedAccount },
  ThunkApi
>(
  `${reducerName}/importPrivateKeyAccountAndCreateWallet`,
  async ({ accountDetails }, thunkApi) => {
    const newWalletId = uuid()
    const state = thunkApi.getState()
    const wallets = selectWallets(state)
    const walletCount = Object.keys(wallets).length
    const newWalletName = generateWalletName(
      WalletType.PRIVATE_KEY,
      walletCount + 1
    )

    const newWallet: Wallet = {
      id: newWalletId,
      name: newWalletName,
      type: WalletType.PRIVATE_KEY,
      isActive: true
    }

    thunkApi.dispatch(addWallet(newWallet))
    thunkApi.dispatch(setActiveWallet(newWalletId))

    const accountToImport: ImportedAccount = {
      ...accountDetails,
      walletId: newWalletId,
      active: true
    }

    thunkApi.dispatch(setAccount(accountToImport))
    thunkApi.dispatch(setActiveAccount(accountToImport.id))
  }
)
