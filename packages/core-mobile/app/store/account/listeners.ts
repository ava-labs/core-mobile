import accountService from 'services/account/AccountsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked, onLogIn } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import { isEvmPublicKey } from 'utils/publicKeys'
import { selectActiveNetwork } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
import { recentAccountsStore } from 'new/features/accountSettings/store'
import { selectActiveWallet, selectActiveWalletId } from 'store/wallet/slice'
import BiometricsSDK from 'utils/BiometricsSDK'
import WalletFactory from 'services/wallet/WalletFactory'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { transactionSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import {
  selectAccounts,
  setAccounts,
  setNonActiveAccounts,
  setActiveAccountId
} from './slice'
import { AccountCollection } from './types'

const initAccounts = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeNetwork = selectActiveNetwork(state)
  const activeWallet = selectActiveWallet(state)
  let accounts: AccountCollection = {}

  if (!activeWallet) {
    throw new Error('Active wallet is not set')
  }

  const walletSecret = await BiometricsSDK.loadWalletSecret(activeWallet.id)
  if (!walletSecret.success) {
    throw new Error('Failed to load wallet secret')
  }

  if (activeWallet.type === WalletType.SEEDLESS) {
    try {
      await SeedlessService.refreshPublicKeys()
    } catch (error) {
      Logger.error(
        'Failed to fetch and save public keys for Seedless wallet',
        error
      )
    }
  }

  const acc = await accountService.createNextAccount({
    index: 0,
    walletType: activeWallet.type,
    network: activeNetwork,
    walletId: activeWallet.id,
    name: `Account 1`
  })

  if (activeWallet.type === WalletType.SEEDLESS) {
    const title = await SeedlessService.getAccountName(0)
    const accountTitle = title ?? acc.name
    accounts[acc.id] = { ...acc, name: accountTitle }
    listenerApi.dispatch(setAccounts(accounts))
    const firstAccountId = Object.keys(accounts)[0]
    if (!firstAccountId) {
      throw new Error('No accounts created')
    }
    listenerApi.dispatch(setActiveAccountId(firstAccountId))

    // to avoid initial account fetching taking too long,
    // we fetch the remaining accounts in the background
    const addedAccounts = await fetchRemainingAccounts({
      walletType: activeWallet.type,
      startIndex: 1,
      listenerApi
    })

    accounts = { ...accounts, ...addedAccounts }

    const entries = Object.values(accounts)
    if (entries.some(account => !account.addressSVM)) {
      await deriveMissingSeedlessSessionKeys(activeWallet.id)
      // reload only when there are accounts without Solana addresses
      reloadAccounts(_action, listenerApi)
    }
  } else if (
    activeWallet.type === WalletType.MNEMONIC ||
    activeWallet.type === WalletType.PRIVATE_KEY
  ) {
    accounts[acc.id] = acc

    listenerApi.dispatch(setAccounts(accounts))
    const firstAccountId = Object.keys(accounts)[0]
    if (!firstAccountId) {
      throw new Error('No accounts created')
    }
    listenerApi.dispatch(setActiveAccountId(firstAccountId))
  }

  if (isDeveloperMode === false) {
    AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
      addresses: Object.values(accounts).map(account => ({
        address: account.addressC,
        addressBtc: account.addressBTC,
        addressAVM: account.addressAVM ?? '',
        addressPVM: account.addressPVM ?? '',
        addressCoreEth: account.addressCoreEth ?? '',
        addressSVM: acc.addressSVM ?? ''
      }))
    })
  }
}

const fetchRemainingAccounts = async ({
  walletType,
  listenerApi,
  startIndex
}: {
  walletType: WalletType
  listenerApi: AppListenerEffectAPI
  startIndex: number
}): Promise<AccountCollection> => {
  /**
   * note:
   * adding accounts cannot be parallelized, they need to be added one-by-one.
   * otherwise race conditions occur and addresses get mixed up.
   */
  const state = listenerApi.getState()
  const activeNetwork = selectActiveNetwork(state)
  const pubKeys = await SeedlessPubKeysStorage.retrieve()
  const numberOfAccounts = pubKeys.filter(isEvmPublicKey).length

  const accounts: AccountCollection = {}
  const activeWalletId = selectActiveWalletId(state)

  if (!activeWalletId) {
    throw new Error('Active wallet ID is not set')
  }
  // fetch the remaining accounts in the background
  for (let i = startIndex; i < numberOfAccounts; i++) {
    const acc = await accountService.createNextAccount({
      index: i,
      walletType,
      network: activeNetwork,
      walletId: activeWalletId,
      name: `Account ${i + 1}`
    })
    const title = await SeedlessService.getAccountName(i)
    const accountTitle = title ?? acc.name
    accounts[acc.id] = { ...acc, name: accountTitle }
  }
  listenerApi.dispatch(setNonActiveAccounts(accounts))

  return accounts
}

// reload addresses
const reloadAccounts = async (
  _action: unknown,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeWallet = selectActiveWallet(state)

  if (!activeWallet) {
    throw new Error('Active wallet is not set')
  }

  // all vm modules need is just the isTestnet flag
  const network = {
    isTestnet: isDeveloperMode
  } as Network

  const accounts = selectAccounts(state)
  const reloadedAccounts = await accountService.reloadAccounts({
    accounts: accounts,
    network: network as Network,
    walletId: activeWallet.id,
    walletType: activeWallet.type
  })

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

const handleActiveAccountIndexChange = (
  action: ReturnType<typeof setActiveAccountId>
): void => {
  recentAccountsStore.getState().addRecentAccount(action.payload)
}

const fetchSeedlessAccountsIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const activeWallet = selectActiveWallet(state)
  if (!activeWallet) {
    throw new Error('Active wallet is not set')
  }

  if (activeWallet.type === WalletType.SEEDLESS) {
    const accounts = selectAccounts(state)

    fetchRemainingAccounts({
      walletType: activeWallet.type,
      listenerApi,
      startIndex: Object.keys(accounts).length
    })
  }
}

const migrateSolanaAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const accounts = selectAccounts(state)
  const entries = Object.values(accounts)
  if (entries.some(account => !account.addressSVM)) {
    const activeWallet = selectActiveWallet(state)
    if (activeWallet?.type === WalletType.SEEDLESS) {
      await deriveMissingSeedlessSessionKeys(activeWallet.id)
    }
    // reload only when there are accounts without Solana addresses
    reloadAccounts(_action, listenerApi)
  }
}

const deriveMissingSeedlessSessionKeys = async (
  walletId: string
): Promise<void> => {
  transactionSnackbar.pending({ message: 'Updating accounts...' })

  const wallet = await WalletFactory.createWallet({
    walletId,
    walletType: WalletType.SEEDLESS
  })
  if (wallet instanceof SeedlessWallet) {
    // prompt Core Seedless API to derive missing keys
    await wallet.deriveMissingKeys()

    transactionSnackbar.success({ message: 'Accounts updated' })
  }
}

export const addAccountListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onLogIn,
    effect: initAccounts
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: reloadAccounts
  })

  startListening({
    actionCreator: setActiveAccountId,
    effect: handleActiveAccountIndexChange
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: fetchSeedlessAccountsIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: migrateSolanaAddressesIfNeeded
  })
}
