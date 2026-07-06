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
import { AccountCollection, LedgerAddressesCollection } from './types'
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
    const ledgerAddresses = selectLedgerAddressesByWalletId(state, wallet.id)
    //convert accounts to AccountCollection
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
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
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
    await reloadAccounts(_action, listenerApi)
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

const rederiveAvmPvmAddressesIfNeeded = async (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
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
    effect: handleInitAccountsIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: migrateSolanaAddressesIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: rederiveAvmPvmAddressesIfNeeded
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
