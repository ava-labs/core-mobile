import AccountsService from 'services/account/AccountsService'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  AddressIndex,
  getAddressesFromXpubXP
} from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import { recentAccountsStore } from 'new/features/accountSettings/store'
import {
  selectActiveWallet,
  selectIsMigratingActiveAccounts,
  selectSeedlessWallet,
  selectWallets,
  setWalletName
} from 'store/wallet/slice'
import { Wallet as StoreWallet } from 'store/wallet/types'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import KeystoneService from 'features/keystone/services/KeystoneService'
import { pendingSeedlessWalletNameStore } from 'features/onboarding/store'
import {
  selectAccounts,
  setAccounts,
  setActiveAccountId,
  selectAccountsByWalletId,
  selectActiveAccount
} from './slice'
import { AccountCollection, Account, XPAddressDictionary } from './types'
import {
  canMigrateActiveAccounts,
  deriveMissingSeedlessSessionKeys,
  migrateRemainingActiveAccounts,
  shouldMigrateActiveAccounts,
  hasCompletedXpAddressMigration,
  markXpAddressMigrationComplete
} from './utils'

const initAccounts = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)
  const activeWallet = selectActiveWallet(state)
  const accounts: AccountCollection = {}

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

  if (activeWallet.type === WalletType.KEYSTONE) {
    try {
      await KeystoneService.save()
    } catch (error) {
      Logger.error('Failed to save public keys for Keystone wallet', error)
    }
  }

  const name = await AccountsService.getAccountName({
    walletType: activeWallet.type,
    accountIndex: 0
  })

  const acc = await AccountsService.createNextAccount({
    index: 0,
    walletType: activeWallet.type,
    isTestnet: isDeveloperMode,
    walletId: activeWallet.id,
    name
  })

  if (
    activeWallet.type === WalletType.MNEMONIC ||
    activeWallet.type === WalletType.KEYSTONE ||
    activeWallet.type === WalletType.PRIVATE_KEY ||
    activeWallet.type === WalletType.SEEDLESS
  ) {
    accounts[acc.id] = acc
    listenerApi.dispatch(setAccounts(accounts))
    const firstAccountId = Object.keys(accounts)[0]
    if (!firstAccountId) {
      throw new Error('No accounts created')
    }
    listenerApi.dispatch(setActiveAccountId(firstAccountId))
  }

  const accountValues = Object.values(accounts)
  if (activeWallet.type === WalletType.SEEDLESS) {
    // setting wallet name
    const { pendingSeedlessWalletName } =
      pendingSeedlessWalletNameStore.getState()

    if (pendingSeedlessWalletName) {
      AnalyticsService.capture('Onboard:WalletNameSet')
      listenerApi.dispatch(
        setWalletName({
          walletId: activeWallet.id,
          name: pendingSeedlessWalletName
        })
      )
      pendingSeedlessWalletNameStore.setState({
        pendingSeedlessWalletName: undefined
      })
    }

    // Only derive missing Solana keys if Solana support is enabled
    if (
      !isSolanaSupportBlocked &&
      accountValues.some(account => !account.addressSVM)
    ) {
      await deriveMissingSeedlessSessionKeys(activeWallet.id)
      // reload only when there are accounts without Solana addresses
      reloadAccounts(_action, listenerApi)
    }
  }

  if (isDeveloperMode === false) {
    AnalyticsService.captureWithEncryption('AccountAddressesUpdated', {
      addresses: accountValues.map(account => ({
        address: account.addressC,
        addressBtc: account.addressBTC,
        addressAVM: account.addressAVM ?? '',
        addressPVM: account.addressPVM ?? '',
        addressCoreEth: account.addressCoreEth ?? '',
        addressSVM: acc.addressSVM ?? ''
      }))
    })
  }

  if (canMigrateActiveAccounts(activeWallet)) {
    const numberOfAccounts = Math.max(1, accountValues.length)
    await migrateRemainingActiveAccounts({
      listenerApi,
      walletId: activeWallet.id,
      walletType: activeWallet.type,
      startIndex: numberOfAccounts
    })
  }
}

// reload addresses
const reloadAccounts = async (
  _action: unknown,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)
  for (const wallet of Object.values(wallets)) {
    const accounts = selectAccountsByWalletId(state, wallet.id)
    //convert accounts to AccountCollection
    const accountsCollection: AccountCollection = {}
    for (const account of accounts) {
      accountsCollection[account.id] = account
    }

    const reloadedAccounts = await AccountsService.reloadAccounts({
      accounts: accountsCollection,
      isTestnet: isDeveloperMode,
      walletId: wallet.id,
      walletType: wallet.type
    })
    listenerApi.dispatch(setAccounts(reloadedAccounts))
  }
}

const handleActiveAccountIndexChange = (
  action: ReturnType<typeof setActiveAccountId>
): void => {
  recentAccountsStore.getState().updateRecentAccount(action.payload)
}

const migrateActiveAccountsIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const activeWallet = selectActiveWallet(state)
  const activeAccount = selectActiveAccount(state)
  const isMigratingActiveAccounts = selectIsMigratingActiveAccounts(state)

  if (
    !activeWallet ||
    isMigratingActiveAccounts ||
    !canMigrateActiveAccounts(activeWallet) ||
    !activeAccount
  ) {
    return
  }
  const accounts = selectAccountsByWalletId(state, activeWallet.id)
  // there should be at least one account
  const numberOfAccounts = Math.max(1, Object.keys(accounts).length)
  const shouldMigrate = await shouldMigrateActiveAccounts({
    wallet: activeWallet,
    numberOfAccounts
  })

  if (shouldMigrate) {
    await migrateRemainingActiveAccounts({
      listenerApi,
      walletId: activeWallet.id,
      walletType: activeWallet.type,
      startIndex: numberOfAccounts
    })
  }
}

const migrateSolanaAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)
  const accounts = selectAccounts(state)
  const entries = Object.values(accounts)
  // Only migrate Solana addresses if Solana support is enabled
  if (!isSolanaSupportBlocked && entries.some(account => !account.addressSVM)) {
    const seedlessWallet = selectSeedlessWallet(state)
    if (seedlessWallet) {
      await deriveMissingSeedlessSessionKeys(seedlessWallet.id)
    }
    // reload only when there are accounts without Solana addresses
    reloadAccounts(_action, listenerApi)
  }
}

const handleInitAccountsIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const accounts = selectAccounts(state)

  // if there are no accounts, we need to initialize them
  // initAcounts after onboarding might have failed
  // or user might have force quit the app while creating the first account
  if (Object.keys(accounts).length === 0) {
    await initAccounts(_action, listenerApi)
    return
  }

  // if there are accounts, we need to migrate them
  migrateActiveAccountsIfNeeded(_action, listenerApi)
}

const migrateXpAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  if (hasCompletedXpAddressMigration()) {
    Logger.info('XP address migration already completed. Skipping.')
    return
  }

  const state = listenerApi.getState()
  Logger.info('Migrating XP addresses if needed')

  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)
  const updatedAccounts: AccountCollection = {}
  let encounteredError = false

  Logger.info('Wallets', wallets)

  for (const wallet of Object.values(wallets)) {
    Logger.info('Wallet', wallet)

    if (WalletType.PRIVATE_KEY.includes(wallet.type)) {
      Logger.info(
        `Skipping XP address derivation for private key wallet of type ${wallet.type}`
      )
      continue
    }

    if (wallet.type === WalletType.SEEDLESS) {
      await migrateSeedlessWalletXpAddresses({
        listenerApi,
        wallet,
        isDeveloperMode
      })
      continue
    }

    const accounts = selectAccountsByWalletId(state, wallet.id)
    const walletErrored = await populateXpAddressesForWallet({
      wallet,
      accounts,
      isDeveloperMode,
      updatedAccounts
    })
    if (walletErrored) {
      encounteredError = true
    }
  }

  if (Object.keys(updatedAccounts).length > 0) {
    listenerApi.dispatch(setAccounts(updatedAccounts))
    Logger.info('✅ XP address migration updates applied')
  } else {
    Logger.info('No XP address updates needed for any accounts')
  }

  if (!encounteredError) {
    markXpAddressMigrationComplete()
  }
}

const migrateSeedlessWalletXpAddresses = async ({
  listenerApi,
  wallet,
  isDeveloperMode
}: {
  listenerApi: AppListenerEffectAPI
  wallet: StoreWallet
  isDeveloperMode: boolean
}): Promise<void> => {
  const state = listenerApi.getState()
  const accounts = selectAccountsByWalletId(state, wallet.id)
  if (!accounts.length) {
    return
  }

  const accountsToUpdate: AccountCollection = {}
  for (const account of accounts) {
    if (account.index === 0) {
      continue
    }

    if (account.addressAVM !== undefined || account.addressPVM !== undefined) {
      accountsToUpdate[account.id] = {
        ...account,
        addressAVM: undefined,
        addressPVM: undefined
      }
    }
  }

  if (Object.keys(accountsToUpdate).length > 0) {
    listenerApi.dispatch(setAccounts(accountsToUpdate))
  }

  await deriveMissingSeedlessSessionKeys(wallet.id)
  await reloadSeedlessWalletAccounts({
    listenerApi,
    wallet,
    isDeveloperMode
  })
}

const reloadSeedlessWalletAccounts = async ({
  listenerApi,
  wallet,
  isDeveloperMode
}: {
  listenerApi: AppListenerEffectAPI
  wallet: StoreWallet
  isDeveloperMode: boolean
}): Promise<void> => {
  const latestState = listenerApi.getState()
  const accounts = selectAccountsByWalletId(latestState, wallet.id)
  if (!accounts.length) {
    return
  }

  const accountsCollection: AccountCollection = {}
  for (const account of accounts) {
    accountsCollection[account.id] = account
  }

  const reloadedAccounts = await AccountsService.reloadAccounts({
    accounts: accountsCollection,
    isTestnet: isDeveloperMode,
    walletId: wallet.id,
    walletType: wallet.type
  })

  listenerApi.dispatch(setAccounts(reloadedAccounts))
}

const populateXpAddressesForWallet = async ({
  wallet,
  accounts,
  isDeveloperMode,
  updatedAccounts
}: {
  wallet: StoreWallet
  accounts: Account[]
  isDeveloperMode: boolean
  updatedAccounts: AccountCollection
}): Promise<boolean> => {
  const restrictToFirstIndex = [
    WalletType.KEYSTONE,
    WalletType.LEDGER,
    WalletType.LEDGER_LIVE
  ].includes(wallet.type)

  let encounteredError = false

  for (const account of accounts) {
    Logger.info(
      `Processing account ${account.index} (${account.id}) for wallet ${wallet.type}`
    )
    Logger.info(
      `Current addresses - AVM: ${account.addressAVM}, PVM: ${account.addressPVM}`
    )

    if (restrictToFirstIndex && account.index !== 0) {
      Logger.info(
        `Skipping hardware wallet account ${account.index} until device connection`
      )
      updatedAccounts[account.id] = {
        ...account,
        addressAVM: undefined,
        addressPVM: undefined,
        xpAddresses: [] as AddressIndex[],
        xpAddressDictionary: {} as XPAddressDictionary
      }
      continue
    }

    try {
      Logger.info(`Deriving XP addresses for account ${account.index}...`)
      const addresses = await AccountsService.getAddresses({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index,
        isTestnet: isDeveloperMode
      })

      const newAVM = addresses[NetworkVMType.AVM]
      const newPVM = addresses[NetworkVMType.PVM]

      const { xpAddresses, xpAddressDictionary } = await getAddressesFromXpubXP(
        {
          isDeveloperMode,
          walletId: wallet.id,
          walletType: wallet.type,
          accountIndex: account.index,
          onlyWithActivity: true
        }
      )

      updatedAccounts[account.id] = {
        ...account,
        addressAVM: newAVM,
        addressPVM: newPVM,
        xpAddresses: xpAddresses as Account['xpAddresses'],
        xpAddressDictionary:
          xpAddressDictionary as Account['xpAddressDictionary']
      }
    } catch (error) {
      Logger.error(
        `Failed to derive XP addresses for account ${account.index} in wallet ${wallet.id}`,
        error
      )
      encounteredError = true
    }
  }

  return encounteredError
}

export const addAccountListeners = (
  startListening: AppStartListening
): void => {
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
    effect: handleInitAccountsIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: migrateSolanaAddressesIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: migrateXpAddressesIfNeeded
  })
}
