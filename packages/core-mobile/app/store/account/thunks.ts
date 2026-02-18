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
import { storeWallet } from 'store/wallet/thunks'
import { WalletType } from 'services/wallet/types'
import { removeWallet } from 'store/wallet/thunks'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import {
  reducerName,
  selectAccountById,
  selectAccounts,
  selectAccountsByWalletId,
  setAccount,
  setActiveAccountId,
  removeAccount,
  selectActiveAccount,
  setLedgerAddresses
} from './slice'

export const addAccount = createAsyncThunk<void, string, ThunkApi>(
  `${reducerName}/addAccount`,
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async (walletId, thunkApi) => {
    const state = thunkApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    const wallet = selectWalletById(walletId)(state)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const accountsByWalletId = selectAccountsByWalletId(state, walletId)
    const existingAccountsCount = accountsByWalletId.length

    const result = await AccountsService.createNextAccount({
      name: `Account ${existingAccountsCount + 1}`,
      index: existingAccountsCount,
      walletType: wallet.type,
      isTestnet: isDeveloperMode,
      walletId
    })

    const acc = result.account
    thunkApi.dispatch(setAccount(acc))
    thunkApi.dispatch(setActiveAccountId(acc.id))

    if (
      wallet.type === WalletType.LEDGER ||
      wallet.type === WalletType.LEDGER_LIVE
    ) {
      // Store the xpub for this account in wallet secret

      if (result.xpub) {
        const secretResult = await BiometricsSDK.loadWalletSecret(walletId)
        if (secretResult.success && secretResult.value) {
          const parsedSecret = JSON.parse(secretResult.value)

          // Add the new account's xpub to the per-account format
          const extendedPublicKeys = {
            ...parsedSecret.extendedPublicKeys,
            [existingAccountsCount]: result.xpub
          }

          await thunkApi
            .dispatch(
              storeWallet({
                walletId,
                name: wallet.name,
                type: wallet.type,
                walletSecret: JSON.stringify({
                  ...parsedSecret,
                  extendedPublicKeys
                })
              })
            )
            .unwrap()
          await thunkApi
            .dispatch(
              storeWallet({
                walletId,
                name: wallet.name,
                type: wallet.type,
                walletSecret: JSON.stringify({
                  ...parsedSecret,
                  extendedPublicKeys
                })
              })
            )
            .unwrap()

          Logger.info(
            `Stored xpub for account ${existingAccountsCount} in wallet secret`
          )
        }
      }

      const ledgerResult = await AccountsService.createNextAccount({
        name: `Account ${existingAccountsCount + 1}`,
        index: existingAccountsCount,
        walletType: wallet.type,
        isTestnet: !isDeveloperMode,
        walletId
      })

      const ledgerAccount = ledgerResult.account
      const testnetAccount = isDeveloperMode ? acc : ledgerAccount
      const mainnetAccount = isDeveloperMode ? ledgerAccount : acc

      thunkApi.dispatch(
        setLedgerAddresses({
          [acc.id]: {
            mainnet: {
              addressBTC: mainnetAccount.addressBTC,
              addressAVM: mainnetAccount.addressAVM,
              addressPVM: mainnetAccount.addressPVM,
              addressCoreEth: mainnetAccount.addressCoreEth ?? ''
            },
            testnet: {
              addressBTC: testnetAccount.addressBTC,
              addressAVM: testnetAccount.addressAVM,
              addressPVM: testnetAccount.addressPVM,
              addressCoreEth: testnetAccount.addressCoreEth ?? ''
            },
            walletId: wallet.id,
            index: existingAccountsCount,
            id: acc.id
          }
        })
      )
    }

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

    // fail safe, UI should prevent this from happening
    if (wallet?.type === WalletType.SEEDLESS) {
      throw new Error('Seedless wallets do not support account removal')
    }

    if (!accountToRemove) {
      throw new Error(`Account with ID "${accountId}" not found`)
    }

    const accountsInWallet = selectAccountsByWalletId(
      state,
      accountToRemove.walletId
    )

    if (wallet?.type === WalletType.PRIVATE_KEY) {
      // For private key wallets, remove the wallet along with the account
      // First, handle active account switching if needed
      if (activeAccount?.id === accountId) {
        // Find another account from a different wallet to set as active
        const allAccounts = selectAccounts(state)
        const otherAccount = Object.values(allAccounts).find(
          acc => acc.walletId !== accountToRemove.walletId
        )

        if (otherAccount) {
          thunkApi.dispatch(setActiveAccountId(otherAccount.id))
        }
      }

      // Remove the entire wallet (this will also remove the account)
      thunkApi.dispatch(removeWallet(accountToRemove.walletId))
      return
    }

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
