import AccountsService from 'services/account/AccountsService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { onAppUnlocked, onWalletImported } from 'store/app/slice'
import { WalletType } from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import { recentAccountsStore } from 'new/features/accountSettings/store'
import {
  selectActiveWallet,
  selectIsMigratingActiveAccounts,
  selectIsWalletLedger,
  selectSeedlessWallet,
  selectWallets,
  setIsMigratingActiveAccounts,
  setWalletName
} from 'store/wallet/slice'
import { transactionSnackbar } from 'common/utils/toast'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import BiometricsSDK from 'utils/BiometricsSDK'
import { mnemonicToSeed } from 'bip39'
import { deriveAllAddressesFromSeed } from 'react-native-nitro-avalabs-crypto'
import Logger from 'utils/Logger'
import KeystoneService from 'features/keystone/services/KeystoneService'
import { discoverLedgerAccountsFromXpubs } from 'new/features/ledger/utils/discoverLedgerAccountsFromXpubs'
import { pendingSeedlessWalletNameStore } from 'features/onboarding/store'
import {
  selectAccounts,
  setAccounts,
  setActiveAccountId,
  setNonActiveAccounts,
  selectAccountsByWalletId,
  selectActiveAccount,
  setLedgerAddresses,
  selectLedgerAddressesByWalletId
} from './slice'
import { Account, AccountCollection, LedgerAddressesCollection } from './types'
import {
  canMigrateActiveAccounts,
  canRederiveAccountAddresses,
  deriveMissingSeedlessSessionKeys,
  isAddressMissing,
  migrateRemainingActiveAccounts,
  rederiveAvmPvmAddressesForAccount,
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
  const isLedger = selectIsWalletLedger(activeWallet?.id)(state)

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

  const result = await AccountsService.createNextAccount({
    index: 0,
    walletType: activeWallet.type,
    isTestnet: isDeveloperMode,
    walletId: activeWallet.id,
    name
  })

  const acc = result.account

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

  if (isLedger) {
    const ledgerResult = await AccountsService.createNextAccount({
      index: 0,
      walletType: activeWallet.type,
      isTestnet: !isDeveloperMode,
      walletId: activeWallet.id,
      name
    })
    const ledgerAccount = ledgerResult.account
    const mainnetAccount = isDeveloperMode ? acc : ledgerAccount
    const testnetAccount = isDeveloperMode ? ledgerAccount : acc
    listenerApi.dispatch(
      setLedgerAddresses({
        [acc.id]: {
          mainnet: {
            addressBTC: mainnetAccount.addressBTC,
            addressAVM: mainnetAccount.addressAVM ?? '',
            addressPVM: mainnetAccount.addressPVM ?? '',
            addressCoreEth: mainnetAccount.addressCoreEth ?? ''
          },
          testnet: {
            addressBTC: testnetAccount.addressBTC,
            addressAVM: testnetAccount.addressAVM ?? '',
            addressPVM: testnetAccount.addressPVM ?? '',
            addressCoreEth: testnetAccount.addressCoreEth ?? ''
          },
          walletId: activeWallet.id,
          index: 0,
          id: acc.id
        }
      })
    )
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
      await reloadAccounts(_action, listenerApi)
    }
  }

  if (isDeveloperMode === false) {
    AnalyticsService.capture('AccountAddressesUpdated', {
      encrypted: {
        addresses: accountValues.map(account => ({
          address: account.addressC,
          addressBtc: account.addressBTC,
          addressAVM: account.addressAVM ?? '',
          addressPVM: account.addressPVM ?? '',
          addressCoreEth: account.addressCoreEth ?? '',
          addressSVM: account.addressSVM ?? ''
        }))
      }
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

// Native path for mnemonic wallets: batch all account indices into a
// single deriveAllAddressesFromSeed call on a native thread (CP-14062).
// Returns true if native derivation succeeded, false to fall back to JS.
const reloadMnemonicWalletNative = async (
  walletId: string,
  accounts: Account[],
  isDeveloperMode: boolean
): Promise<AccountCollection | undefined> => {
  try {
    const secret = await BiometricsSDK.loadWalletSecret(walletId)
    if (!secret.success) return undefined

    const seed = await mnemonicToSeed(secret.value)
    const seedBuffer = seed.buffer.slice(
      seed.byteOffset,
      seed.byteOffset + seed.byteLength
    ) as ArrayBuffer

    const indices = accounts.map(a => a.index)
    const nativeResults = await deriveAllAddressesFromSeed(
      seedBuffer,
      indices,
      isDeveloperMode
    )

    const reloadedAccounts: AccountCollection = {}
    for (let k = 0; k < accounts.length; k++) {
      const account = accounts[k]
      const r = nativeResults[k]
      if (!account || !r) continue

      // Spread the original account first so non-address fields (e.g.
      // `active`, custom flags, or any future-added Account properties)
      // survive the native fast-path. Then overwrite only the address
      // fields with the freshly-derived values. This keeps the native
      // path field-for-field equivalent to the JS fallback in
      // AccountsService.reloadAccounts, which preserves the full account
      // object.
      reloadedAccounts[account.id] = {
        ...account,
        addressBTC: r.btc,
        addressC: r.evm || account.addressC,
        addressAVM: r.avm,
        addressPVM: r.pvm,
        addressCoreEth: r.coreEth,
        addressSVM: r.solana
      }
    }

    return reloadedAccounts
  } catch (error) {
    Logger.error(
      'Native reloadAccounts failed for mnemonic wallet, falling back to JS',
      error
    )
    return undefined
  }
}

// Reload addresses for all wallets.  For mnemonic wallets, uses the native
// Nitro module to derive all addresses in a single off-thread call (CP-14062).
const reloadAccounts = async (
  _action: unknown,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)
  for (const wallet of Object.values(wallets)) {
    const accounts = selectAccountsByWalletId(state, wallet.id)

    if (wallet.type === WalletType.MNEMONIC) {
      const nativeResult = await reloadMnemonicWalletNative(
        wallet.id,
        accounts,
        isDeveloperMode
      )
      if (nativeResult) {
        listenerApi.dispatch(setAccounts(nativeResult))
        continue
      }
    }

    // Fallback for non-mnemonic wallets (Ledger, Seedless, Keystone, etc.)
    const ledgerAddresses = selectLedgerAddressesByWalletId(state, wallet.id)
    const accountsCollection: AccountCollection = {}
    for (const account of accounts) {
      accountsCollection[account.id] = account
    }

    const ledgerAddressesCollection: LedgerAddressesCollection = {}
    for (const addresses of ledgerAddresses) {
      ledgerAddressesCollection[addresses.id] = addresses
    }

    const reloadedAccounts = await AccountsService.reloadAccounts({
      accounts: accountsCollection,
      ledgerAddressesCollection,
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
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  // Re-read state to see accounts created by Phase 1.
  const state = listenerApi.getState()
  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)
  const accounts = selectAccounts(state)
  const entries = Object.values(accounts)
  const seedlessWallet = selectSeedlessWallet(state)
  const hasAccountsWithoutSVM = entries.some(account =>
    isAddressMissing(account.addressSVM)
  )
  const hasSeedlessAccountsWithoutSVM = entries.some(
    account =>
      isAddressMissing(account.addressSVM) &&
      account.walletId === seedlessWallet?.id
  )

  // Only migrate Solana addresses if Solana support is enabled
  if (!isSolanaSupportBlocked && hasAccountsWithoutSVM) {
    if (seedlessWallet && hasSeedlessAccountsWithoutSVM) {
      await deriveMissingSeedlessSessionKeys(seedlessWallet.id)
    }
    // reload only when there are accounts without Solana addresses
    await reloadAccounts(undefined, listenerApi)
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
  await migrateActiveAccountsIfNeeded(_action, listenerApi)
}

const rederiveAvmPvmAddressesIfNeeded = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  // Re-read state to see accounts created/updated by earlier phases.
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)
  const updatedAccounts: AccountCollection = {}

  // Process all wallets
  for (const wallet of Object.values(wallets)) {
    const accounts = selectAccountsByWalletId(state, wallet.id).filter(
      account =>
        isAddressMissing(account.addressAVM) ||
        isAddressMissing(account.addressPVM)
    )

    // For seedless wallets, ensure session keys are derived first
    if (wallet.type === WalletType.SEEDLESS && accounts.length > 0) {
      await deriveMissingSeedlessSessionKeys(wallet.id)
    }

    for (const account of accounts) {
      // Check if we can rederive for this account/wallet combination
      if (!canRederiveAccountAddresses(account, wallet)) {
        continue
      }

      const updatedAccount = await rederiveAvmPvmAddressesForAccount({
        account,
        wallet,
        isDeveloperMode
      })

      if (updatedAccount) {
        updatedAccounts[account.id] = updatedAccount
      }
    }
  }

  // Dispatch updated accounts to Redux store
  if (Object.keys(updatedAccounts).length > 0) {
    listenerApi.dispatch(setAccounts(updatedAccounts))
    Logger.info(
      `Successfully rederived addresses for ${
        Object.keys(updatedAccounts).length
      } account(s)`
    )
  }
}

/**
 * Single orchestrator that runs all post-unlock account tasks in sequence.
 * Previously these fired as 3 independent listeners on onAppUnlocked,
 * competing for the JS thread simultaneously (CP-14062).
 *
 * Phase 1 — Init / migrate accounts (creates accounts the later phases need)
 * Phase 2 — Migrate missing Solana addresses (calls reloadAccounts which
 *           refreshes all addresses; may fill in AVM/PVM too)
 * Phase 3 — Re-derive missing AVM/PVM addresses (skips accounts already
 *           fixed by Phase 2's reload)
 */
const onAppUnlockedOrchestrator = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  // Each phase is wrapped in try-catch so a failure in one phase does not
  // prevent later phases from running.  The previous independent-listener
  // architecture was resilient to individual failures; we preserve that.

  // Phase 1: Initialise accounts or migrate existing ones
  try {
    Logger.info('[onAppUnlocked] Phase 1: init/migrate accounts')
    await handleInitAccountsIfNeeded(_action, listenerApi)
  } catch (error) {
    Logger.error('[onAppUnlocked] Phase 1 failed', error)
  }

  // Phase 2: Derive missing Solana addresses and reload
  try {
    Logger.info('[onAppUnlocked] Phase 2: migrate Solana addresses')
    await migrateSolanaAddressesIfNeeded(listenerApi)
  } catch (error) {
    Logger.error('[onAppUnlocked] Phase 2 failed', error)
  }

  // Phase 3: Re-derive missing AVM/PVM addresses
  try {
    Logger.info('[onAppUnlocked] Phase 3: rederive AVM/PVM addresses')
    await rederiveAvmPvmAddressesIfNeeded(listenerApi)
  } catch (error) {
    Logger.error('[onAppUnlocked] Phase 3 failed', error)
  }
}

const migrateLedgerActiveAccounts = async ({
  listenerApi,
  walletId
}: {
  listenerApi: AppListenerEffectAPI
  walletId: string
}): Promise<void> => {
  Logger.info('migrateLedgerActiveAccounts: ENTERED')
  const { dispatch } = listenerApi
  dispatch(setIsMigratingActiveAccounts(true))

  try {
    // Skip wallet state check for Ledger — we're explicitly triggered from
    // onWalletImported which only fires during import. The wallet may not
    // be ACTIVE yet during onboarding (still navigating to home screen).

    Logger.info(
      'migrateLedgerActiveAccounts: calling discoverLedgerAccountsFromXpubs'
    )
    const discovered = await discoverLedgerAccountsFromXpubs(walletId)
    Logger.info('migrateLedgerActiveAccounts: discovery returned', {
      count: discovered.length
    })

    if (discovered.length === 0) {
      Logger.info('No additional Ledger accounts discovered')
      return
    }

    // Build ledger addresses and accounts for Redux
    const accounts: AccountCollection = {}
    const ledgerAddressEntries: Record<
      string,
      {
        mainnet: {
          addressBTC: string
          addressAVM: string
          addressPVM: string
          addressCoreEth: string
        }
        testnet: {
          addressBTC: string
          addressAVM: string
          addressPVM: string
          addressCoreEth: string
        }
        walletId: string
        index: number
        id: string
      }
    > = {}

    for (const { account, mainnetAddresses, testnetAddresses } of discovered) {
      accounts[account.id] = account
      ledgerAddressEntries[account.id] = {
        mainnet: {
          addressBTC: mainnetAddresses.btc,
          addressAVM: mainnetAddresses.avm,
          addressPVM: mainnetAddresses.pvm,
          addressCoreEth: mainnetAddresses.coreEth
        },
        testnet: {
          addressBTC: testnetAddresses.btc,
          addressAVM: testnetAddresses.avm,
          addressPVM: testnetAddresses.pvm,
          addressCoreEth: testnetAddresses.coreEth
        },
        walletId,
        index: account.index,
        id: account.id
      }
      recentAccountsStore.getState().addRecentAccounts([account.id])
    }

    dispatch(setNonActiveAccounts(accounts))
    dispatch(setLedgerAddresses(ledgerAddressEntries))

    transactionSnackbar.success({
      message: `${discovered.length} ${
        discovered.length > 1 ? 'accounts' : 'account'
      } added`
    })

    Logger.info(
      `Ledger discovery complete: ${discovered.length} accounts created`
    )
  } catch (error) {
    Logger.error('Failed Ledger background account discovery', error)
  } finally {
    dispatch(setIsMigratingActiveAccounts(false))
  }
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
    effect: onAppUnlockedOrchestrator
  })

  startListening({
    actionCreator: onWalletImported,
    effect: async (action, listenerApi) => {
      // Read walletType from the action payload rather than the store
      // to avoid a dependency on wallet already being persisted in Redux.
      const { walletId, walletType } = action.payload

      // Load wallet secret to initialize keychain session for the new wallet.
      // This mirrors what initAccounts does on app restart (line 62) and is
      // required before modules can derive addresses for account discovery.
      const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
      if (!walletSecret.success) {
        Logger.error(
          'Failed to load wallet secret for account discovery after import'
        )
        return
      }

      if (
        walletType === WalletType.LEDGER ||
        walletType === WalletType.LEDGER_LIVE
      ) {
        Logger.info('onWalletImported: starting Ledger account discovery', {
          walletId,
          walletType
        })
        // Ledger: discover accounts from stored xpubs (offline derivation)
        await migrateLedgerActiveAccounts({
          listenerApi,
          walletId
        })
      } else {
        await migrateRemainingActiveAccounts({
          listenerApi,
          walletId,
          walletType,
          startIndex: 1,
          scanWindow: 10
        })
      }
    }
  })
}
