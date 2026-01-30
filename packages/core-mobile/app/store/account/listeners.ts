import AccountsService from 'services/account/AccountsService'
import { getAddressesFromXpubXP } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
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
import { AddressIndex } from '@avalabs/types'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
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
  groupAccountsByWallet,
  isAddressMissing,
  migrateRemainingActiveAccounts,
  processWalletAccountsForRepopulation,
  shouldMigrateActiveAccounts
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
      const refreshTokenResult = await SeedlessService.session.refreshToken()

      /**
       * If refreshTokenResult fails and we don't throw, we'd still call
       * refreshPublicKeys with an invalid/missing session
       */
      if (!refreshTokenResult.success) {
        throw refreshTokenResult.error
      }
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
  const state = listenerApi.getState()
  const allAccounts = selectAccounts(state)
  if (
    Object.values(allAccounts).every(account => account.hasMigratedXpAddresses)
  ) {
    repopulateMissingXpAddressesIfNeeded(_action, listenerApi)
    return
  }

  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)
  const allUpdatedAccounts: AccountCollection = {}

  if (Object.keys(wallets).length === 0) {
    Logger.info('No wallets found. Skipping XP address migration.')
    return
  }

  // Process all wallets in parallel
  const walletPromises = Object.values(wallets).map(async wallet => {
    if (wallet.type === WalletType.PRIVATE_KEY) {
      Logger.info(
        `Skipping XP address derivation for private key wallet of type ${wallet.type}`
      )
      return
    }

    if (wallet.type === WalletType.SEEDLESS) {
      await deriveMissingSeedlessSessionKeys(wallet.id)
    }

    const accounts = selectAccountsByWalletId(state, wallet.id)
    const updatedAccounts = await populateXpAddressesForWallet({
      wallet,
      // Use !== true to also catch undefined (accounts migrated in 1.0.18 without this field)
      accounts: accounts.filter(
        account => account.hasMigratedXpAddresses !== true
      ),
      isDeveloperMode
    })

    // Merge successful account updates
    Object.assign(allUpdatedAccounts, updatedAccounts)
  })

  await Promise.allSettled(walletPromises)

  // Dispatch updated accounts to Redux store
  if (Object.keys(allUpdatedAccounts).length > 0) {
    listenerApi.dispatch(setAccounts(allUpdatedAccounts))
  }

  reloadAccounts(_action, listenerApi)

  if (
    Object.values(allUpdatedAccounts).some(
      account => account.hasMigratedXpAddresses !== true
    )
  ) {
    // Log accounts that failed to migrate
    const failedAccounts = Object.values(allUpdatedAccounts).filter(
      account => !account.hasMigratedXpAddresses
    )

    failedAccounts.forEach(account => {
      Logger.error(
        `XP address migration failed for account index=${account.index}, walletId=${account.walletId}`
      )
    })

    Logger.error(
      `XP address migration incomplete. ${failedAccounts.length} account(s) failed to migrate. Will retry on next app unlock.`
    )
  }

  repopulateMissingXpAddressesIfNeeded(_action, listenerApi)
}

const repopulateMissingXpAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const allAccounts = selectAccounts(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)

  // Find accounts with missing AVM or PVM addresses
  const accountsWithMissingAddresses = Object.values(allAccounts).filter(
    account =>
      isAddressMissing(account.addressAVM) ||
      isAddressMissing(account.addressPVM)
  )

  if (accountsWithMissingAddresses.length === 0) {
    Logger.info('No accounts with missing XP addresses. Skipping repopulation.')
    return
  }

  Logger.info(
    `Found ${accountsWithMissingAddresses.length} account(s) with missing XP addresses. Repopulating...`
  )

  const updatedAccounts: AccountCollection = {}
  const accountsByWallet = groupAccountsByWallet(accountsWithMissingAddresses)

  // Process each wallet's accounts
  for (const [walletId, accounts] of accountsByWallet) {
    const wallet = wallets[walletId]
    if (!wallet) {
      Logger.warn(`Wallet ${walletId} not found. Skipping accounts.`)
      continue
    }

    const walletUpdatedAccounts = await processWalletAccountsForRepopulation({
      wallet,
      accounts,
      isDeveloperMode
    })

    Object.assign(updatedAccounts, walletUpdatedAccounts)
  }

  // Dispatch updates to Redux
  if (Object.keys(updatedAccounts).length > 0) {
    listenerApi.dispatch(setAccounts(updatedAccounts))
    Logger.info(
      `Successfully repopulated XP addresses for ${
        Object.keys(updatedAccounts).length
      } account(s)`
    )
  }
}

const populateXpAddressesForWallet = async ({
  wallet,
  accounts,
  isDeveloperMode
}: {
  wallet: StoreWallet
  accounts: Account[]
  isDeveloperMode: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): Promise<AccountCollection> => {
  const updatedAccounts: AccountCollection = {}

  const restrictToFirstIndex = [
    WalletType.KEYSTONE,
    WalletType.LEDGER,
    WalletType.LEDGER_LIVE
  ].includes(wallet.type)

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    if (!account) {
      continue
    }

    Logger.info(
      `Processing account ${account.index} (${account.id}) for wallet ${wallet.type}`
    )

    if (restrictToFirstIndex && account.index !== 0) {
      Logger.info(
        `Skipping hardware wallet account ${account.index} until device connection`
      )

      updatedAccounts[account.id] = {
        ...account,
        addressAVM: '',
        addressPVM: '',
        hasMigratedXpAddresses: true
      }
      continue
    }

    const strippedAVM = stripAddressPrefix(account.addressAVM)
    const strippedPVM = stripAddressPrefix(account.addressPVM)
    const strippedAvalancheAddress = strippedAVM || strippedPVM

    let xpAddresses: AddressIndex[] = [
      { address: strippedAvalancheAddress, index: 0 }
    ]
    let xpAddressDictionary: XPAddressDictionary = {
      [strippedAvalancheAddress]: { space: 'e', index: 0, hasActivity: false }
    }
    let hasMigratedXpAddresses = false

    try {
      Logger.info(`Deriving XP addresses for account ${account.index}...`)

      const result = await getAddressesFromXpubXP({
        isDeveloperMode,
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index,
        onlyWithActivity: true
      })

      xpAddresses =
        result.xpAddresses.length > 0 ? result.xpAddresses : xpAddresses
      xpAddressDictionary = result.xpAddressDictionary
      hasMigratedXpAddresses = true
    } catch (error) {
      Logger.error(
        `Failed to derive XP addresses for account ${account.index} in wallet ${wallet.id}`,
        error
      )
    }

    // For mnemonic and seedless wallets, rederive AVM and PVM addresses
    let newAddressAVM = account.addressAVM
    let newAddressPVM = account.addressPVM

    if (
      wallet.type === WalletType.MNEMONIC ||
      wallet.type === WalletType.SEEDLESS
    ) {
      try {
        const rederived = await AccountsService.getAddresses({
          walletId: wallet.id,
          walletType: wallet.type,
          accountIndex: account.index,
          isTestnet: isDeveloperMode
        })

        newAddressAVM = rederived[NetworkVMType.AVM]
        newAddressPVM = rederived[NetworkVMType.PVM]

        // If xpAddresses is still using fallback (only has initial AVM address),
        // update it to include both rederived AVM and PVM addresses
        if (!hasMigratedXpAddresses) {
          const strippedNewAVM = stripAddressPrefix(newAddressAVM)
          xpAddresses = [{ address: strippedNewAVM, index: 0 }]
          xpAddressDictionary = {
            [strippedNewAVM]: { space: 'e', index: 0, hasActivity: false }
          }
        }
      } catch (error) {
        Logger.error(
          `Failed to rederive AVM/PVM addresses for account ${account.index}`,
          error
        )
      }
    }

    // Always update the account, even if derivation failed
    updatedAccounts[account.id] = {
      ...account,
      addressAVM: newAddressAVM,
      addressPVM: newAddressPVM,
      xpAddresses,
      xpAddressDictionary,
      hasMigratedXpAddresses
    }
  }

  return updatedAccounts
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
