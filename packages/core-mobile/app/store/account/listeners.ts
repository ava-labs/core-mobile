import AccountsService from 'services/account/AccountsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import { LedgerWalletData } from 'services/ledger/types'
import { migrateLegacyLedgerExtendedKeys } from 'services/ledger/migrateLegacyLedgerExtendedKeys'
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
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import KeystoneService from 'features/keystone/services/KeystoneService'
import { pendingSeedlessWalletNameStore } from 'features/onboarding/store'
import { KeystoneDataStorage } from 'features/keystone/storage/KeystoneDataStorage'
import { bip32 } from 'utils/bip32'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Wallet as StoreWallet } from 'store/wallet/types'
import {
  selectAccounts,
  setAccounts,
  setActiveAccountId,
  selectAccountsByWalletId,
  selectActiveAccount
} from './slice'
import { AccountCollection } from './types'
import {
  canMigrateActiveAccounts,
  deriveMissingSeedlessSessionKeys,
  migrateRemainingActiveAccounts,
  shouldMigrateActiveAccounts,
  isXpMigrationCompleted,
  markXpMigrationCompleted
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

const migrateXpAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  if (isXpMigrationCompleted()) {
    Logger.info('XP addresses migration already completed')
    return
  }

  let state: RootState = listenerApi.getState()
  const wallets = selectWallets(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  let performedLedgerMigration = false

  for (const wallet of Object.values(wallets)) {
    if (wallet.type === WalletType.MNEMONIC) {
      await migrateMnemonicWalletAddresses({
        listenerApi,
        wallet,
        isDeveloperMode
      })
      state = listenerApi.getState()
      continue
    }

    if (wallet.type === WalletType.KEYSTONE) {
      await migrateKeystoneWalletAddresses({
        listenerApi,
        state,
        wallet
      })
      state = listenerApi.getState()
      continue
    }

    if (wallet.type === WalletType.SEEDLESS) {
      await migrateSeedlessWalletAddresses({
        listenerApi,
        wallet
      })
      state = listenerApi.getState()

      await deriveMissingSeedlessSessionKeys(wallet.id)
      continue
    }

    if (
      wallet.type === WalletType.LEDGER ||
      wallet.type === WalletType.LEDGER_LIVE
    ) {
      const migrated = await migrateLedgerExtendedKeysForWallet(wallet.id)
      performedLedgerMigration = performedLedgerMigration || migrated
    }
  }

  if (performedLedgerMigration) {
    Logger.info('Ledger extended public keys migrated for XP addresses')
  }

  markXpMigrationCompleted()
  Logger.info('XP addresses migration completed')
}

const migrateMnemonicWalletAddresses = async ({
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
  if (accounts.length === 0) {
    return
  }

  const updatedAccounts: AccountCollection = {}

  for (const account of accounts) {
    const addresses = await AccountsService.getAddresses({
      walletId: wallet.id,
      walletType: wallet.type,
      accountIndex: account.index,
      isTestnet: isDeveloperMode
    })

    updatedAccounts[account.id] = {
      ...account,
      addressAVM: addresses[NetworkVMType.AVM],
      addressPVM: addresses[NetworkVMType.PVM]
    }
  }

  listenerApi.dispatch(setAccounts(updatedAccounts))
}

const migrateKeystoneWalletAddresses = async ({
  listenerApi,
  state,
  wallet
}: {
  listenerApi: AppListenerEffectAPI
  state: RootState
  wallet: StoreWallet
}): Promise<void> => {
  const accounts = selectAccountsByWalletId(state, wallet.id)
  if (!accounts.length) {
    return
  }

  const keystoneData = await KeystoneDataStorage.retrieve()
  const firstAccountDerivationPath = getAvalancheExtendedKeyPath(0)
  const hasAccountZero = keystoneData.extendedPublicKeys?.some(
    key => key.path === firstAccountDerivationPath
  )

  /**
   * We're going to start storing the extended public keys for each account moving forward.
   * below we need to grab the first account's extended public key and store it in the keystone data storage.
   * so we can use it to derive the addresses for the other accounts
   */
  if (!hasAccountZero && keystoneData.xp) {
    const node = bip32.fromBase58(keystoneData.xp)
    keystoneData.extendedPublicKeys = [
      ...(keystoneData.extendedPublicKeys ?? []),
      {
        path: firstAccountDerivationPath,
        key: keystoneData.xp,
        chainCode: node.chainCode.toString('hex')
      }
    ]

    await KeystoneDataStorage.save(keystoneData)
  }

  const updatedAccounts: AccountCollection = {}

  for (const account of accounts) {
    // we don't need to migrate the first account's addresses
    if (account.index === 0) {
      continue
    }

    // all other accounts (index > 0) x/p chain addresses will be undefined until the user connects their keystone device
    updatedAccounts[account.id] = {
      ...account,
      addressAVM: undefined,
      addressPVM: undefined
    }
  }

  listenerApi.dispatch(setAccounts(updatedAccounts))
}

const migrateSeedlessWalletAddresses = async ({
  listenerApi,
  wallet
}: {
  listenerApi: AppListenerEffectAPI
  wallet: StoreWallet
}): Promise<void> => {
  const state = listenerApi.getState()
  const accounts = selectAccountsByWalletId(state, wallet.id)
  if (!accounts.length) {
    return
  }

  let hasChanges = false
  const updatedAccounts: AccountCollection = {}

  for (const account of accounts) {
    if (account.index === 0) {
      continue
    }

    const hasAvm = account.addressAVM !== undefined
    const hasPvm = account.addressPVM !== undefined

    if (hasAvm || hasPvm) {
      updatedAccounts[account.id] = {
        ...account,
        addressAVM: undefined,
        addressPVM: undefined
      }
      hasChanges = true
    }
  }

  if (hasChanges) {
    listenerApi.dispatch(setAccounts(updatedAccounts))
  }
}

const getAvalancheExtendedKeyPath = (accountIndex: number): string =>
  `m/44'/9000'/${accountIndex}'`

const migrateLedgerExtendedKeysForWallet = async (
  walletId: string
): Promise<boolean> => {
  const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
  if (!walletSecret.success) {
    Logger.warn(`Failed to load wallet secret for Ledger wallet ${walletId}`)
    return false
  }

  try {
    const ledgerData: LedgerWalletData = JSON.parse(walletSecret.value)
    return await migrateLegacyLedgerExtendedKeys({ ledgerData, walletId })
  } catch (error) {
    Logger.error(
      `Failed to migrate legacy Ledger extended keys for wallet ${walletId}`,
      error
    )
    return false
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
    effect: migrateXpAddressesIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: migrateSolanaAddressesIfNeeded
  })
}
