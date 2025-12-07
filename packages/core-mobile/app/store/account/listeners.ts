import AccountsService from 'services/account/AccountsService'
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
  const migrationStartTime = Date.now()
  console.log('🚀 [XP Migration] Starting XP address migration process')

  if (hasCompletedXpAddressMigration()) {
    console.log(
      '✅ [XP Migration] XP address migration already completed. Skipping.'
    )
    Logger.info('XP address migration already completed. Skipping.')
    return
  }

  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const wallets = selectWallets(state)
  const updatedAccounts: AccountCollection = {}
  let encounteredError = false
  let totalWallets = 0
  let processedWallets = 0
  let totalAccounts = 0
  let processedAccounts = 0
  let successfulAccounts = 0
  let failedAccounts = 0

  console.log(
    `🔧 [XP Migration] Configuration: isDeveloperMode=${isDeveloperMode}`
  )
  console.log(
    `📊 [XP Migration] Found ${Object.keys(wallets).length} wallets to process`
  )
  Logger.info('Migrating XP addresses if needed')
  Logger.info('Wallets', wallets)

  // Count total accounts for progress tracking
  for (const wallet of Object.values(wallets)) {
    if (!WalletType.PRIVATE_KEY.includes(wallet.type)) {
      totalWallets++
      const accounts = selectAccountsByWalletId(state, wallet.id)
      totalAccounts += accounts.length
    }
  }

  console.log(
    `📈 [XP Migration] Total migration scope: ${totalWallets} wallets, ${totalAccounts} accounts`
  )

  for (const wallet of Object.values(wallets)) {
    const walletStartTime = Date.now()
    console.log(
      `\n🏦 [XP Migration] Processing wallet ${
        processedWallets + 1
      }/${totalWallets}`
    )
    console.log(
      `📝 [XP Migration] Wallet details: ID=${wallet.id}, Type=${
        wallet.type
      }, Name=${wallet.name || 'Unnamed'}`
    )
    Logger.info('Wallet', wallet)

    if (WalletType.PRIVATE_KEY.includes(wallet.type)) {
      console.log(
        `⏭️  [XP Migration] Skipping private key wallet (${wallet.type}) - XP addresses not applicable`
      )
      Logger.info(
        `Skipping XP address derivation for private key wallet of type ${wallet.type}`
      )
      continue
    }

    const accounts = selectAccountsByWalletId(state, wallet.id)
    console.log(
      `👥 [XP Migration] Found ${accounts.length} accounts in wallet ${wallet.id}`
    )

    // Log current state of accounts before migration
    accounts.forEach((account, index) => {
      console.log(
        `📋 [XP Migration] Account ${index + 1}/${
          accounts.length
        } BEFORE migration:`
      )
      console.log(`   - ID: ${account.id}`)
      console.log(`   - Index: ${account.index}`)
      console.log(`   - Name: ${account.name || 'Unnamed'}`)
      console.log(`   - AVM Address: ${account.addressAVM || 'Not set'}`)
      console.log(`   - PVM Address: ${account.addressPVM || 'Not set'}`)
      console.log(
        `   - XP Addresses Count: ${account.xpAddresses?.length || 0}`
      )
      console.log(
        `   - XP Dictionary Keys: ${
          Object.keys(account.xpAddressDictionary || {}).length
        }`
      )
    })

    try {
      const walletErrored = await populateXpAddressesForWallet({
        wallet,
        accounts,
        isDeveloperMode,
        updatedAccounts
      })

      const walletDuration = Date.now() - walletStartTime
      console.log(
        `⏱️  [XP Migration] Wallet ${wallet.id} processed in ${walletDuration}ms`
      )

      if (walletErrored) {
        console.log(
          `❌ [XP Migration] Wallet ${wallet.id} encountered errors during processing`
        )
        encounteredError = true
        failedAccounts += accounts.length
      } else {
        console.log(
          `✅ [XP Migration] Wallet ${wallet.id} processed successfully`
        )
        successfulAccounts += accounts.length
      }
    } catch (error) {
      console.log(
        `💥 [XP Migration] Critical error processing wallet ${wallet.id}:`,
        error
      )
      Logger.error(`Critical error processing wallet ${wallet.id}`, error)
      encounteredError = true
      failedAccounts += accounts.length
    }

    // Log updated accounts after wallet processing
    accounts.forEach((account, index) => {
      const updatedAccount = updatedAccounts[account.id]
      if (updatedAccount) {
        console.log(
          `📋 [XP Migration] Account ${index + 1}/${
            accounts.length
          } AFTER migration:`
        )
        console.log(`   - ID: ${updatedAccount.id}`)
        console.log(`   - Index: ${updatedAccount.index}`)
        console.log(
          `   - AVM Address: ${updatedAccount.addressAVM || 'Not set'}`
        )
        console.log(
          `   - PVM Address: ${updatedAccount.addressPVM || 'Not set'}`
        )
        console.log(
          `   - XP Addresses Count: ${updatedAccount.xpAddresses?.length || 0}`
        )
        console.log(
          `   - XP Dictionary Keys: ${
            Object.keys(updatedAccount.xpAddressDictionary || {}).length
          }`
        )

        // Compare before and after
        const beforeXpCount = account.xpAddresses?.length || 0
        const afterXpCount = updatedAccount.xpAddresses?.length || 0
        const beforeDictCount = Object.keys(
          account.xpAddressDictionary || {}
        ).length
        const afterDictCount = Object.keys(
          updatedAccount.xpAddressDictionary || {}
        ).length

        console.log(`🔄 [XP Migration] Changes for account ${account.id}:`)
        console.log(
          `   - AVM Address: ${account.addressAVM || 'null'} → ${updatedAccount.addressAVM || 'null'} ${account.addressAVM !== updatedAccount.addressAVM ? '(CHANGED)' : '(same)'}`
        )
        console.log(
          `   - PVM Address: ${account.addressPVM || 'null'} → ${updatedAccount.addressPVM || 'null'} ${account.addressPVM !== updatedAccount.addressPVM ? '(CHANGED)' : '(same)'}`
        )
        console.log(
          `   - XP Addresses: ${beforeXpCount} → ${afterXpCount} (${
            afterXpCount - beforeXpCount >= 0 ? '+' : ''
          }${afterXpCount - beforeXpCount})`
        )
        console.log(
          `   - Dictionary entries: ${beforeDictCount} → ${afterDictCount} (${
            afterDictCount - beforeDictCount >= 0 ? '+' : ''
          }${afterDictCount - beforeDictCount})`
        )
      }
    })

    processedWallets++
    processedAccounts += accounts.length
    console.log(
      `📊 [XP Migration] Progress: ${processedWallets}/${totalWallets} wallets, ${processedAccounts}/${totalAccounts} accounts`
    )

    try {
      console.log(
        `🔑 [XP Migration] Deriving missing seedless session keys for wallet ${wallet.id}`
      )
      await deriveMissingSeedlessSessionKeys(wallet.id)
      console.log(
        `✅ [XP Migration] Seedless session keys derived successfully for wallet ${wallet.id}`
      )
    } catch (error) {
      console.log(
        `⚠️  [XP Migration] Failed to derive seedless session keys for wallet ${wallet.id}:`,
        error
      )
      Logger.error(
        `Failed to derive seedless session keys for wallet ${wallet.id}`,
        error
      )
      // Continue migration even if seedless key derivation fails
    }
  }

  console.log(`\n🔄 [XP Migration] Reloading accounts to apply changes`)
  try {
    reloadAccounts(_action, listenerApi)
    console.log(`✅ [XP Migration] Accounts reloaded successfully`)
  } catch (error) {
    console.log(`❌ [XP Migration] Failed to reload accounts:`, error)
    Logger.error('Failed to reload accounts during XP migration', error)
  }

  const migrationDuration = Date.now() - migrationStartTime
  console.log(`\n📊 [XP Migration] Migration Summary:`)
  console.log(`   - Total Duration: ${migrationDuration}ms`)
  console.log(`   - Wallets Processed: ${processedWallets}/${totalWallets}`)
  console.log(`   - Accounts Processed: ${processedAccounts}/${totalAccounts}`)
  console.log(`   - Successful Accounts: ${successfulAccounts}`)
  console.log(`   - Failed Accounts: ${failedAccounts}`)
  console.log(
    `   - Overall Success Rate: ${
      totalAccounts > 0
        ? ((successfulAccounts / totalAccounts) * 100).toFixed(1)
        : 0
    }%`
  )

  if (!encounteredError) {
    console.log(
      `🎉 [XP Migration] Migration completed successfully! Marking as complete.`
    )
    markXpAddressMigrationComplete()
  } else {
    console.log(
      `⚠️  [XP Migration] Migration completed with errors. Will retry on next app unlock.`
    )
    Logger.warn(
      'XP address migration completed with errors. Will retry on next app unlock.'
    )
  }

  console.log(`🏁 [XP Migration] XP address migration process finished`)
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
  const walletStartTime = Date.now()
  let walletHasErrors = false

  console.log(
    `\n💼 [Wallet Processing] Starting wallet processing: ${wallet.id}`
  )
  console.log(`📝 [Wallet Processing] Wallet type: ${wallet.type}`)
  console.log(`👥 [Wallet Processing] Accounts to process: ${accounts.length}`)

  const restrictToFirstIndex = [
    WalletType.KEYSTONE,
    WalletType.LEDGER,
    WalletType.LEDGER_LIVE,
    WalletType.SEEDLESS
  ].includes(wallet.type)

  if (restrictToFirstIndex) {
    console.log(
      `🔒 [Wallet Processing] Hardware/Seedless wallet detected - restricting to first account only`
    )
  }

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    if (!account) {
      console.log(
        `⚠️  [Account Processing] Account at index ${i} is undefined, skipping`
      )
      continue
    }

    const accountStartTime = Date.now()

    console.log(
      `\n📄 [Account Processing] Processing account ${i + 1}/${accounts.length}`
    )
    console.log(`🏷️  [Account Processing] Account ID: ${account.id}`)
    console.log(`🔢 [Account Processing] Account Index: ${account.index}`)
    console.log(
      `📛 [Account Processing] Account Name: ${account.name || 'Unnamed'}`
    )

    Logger.info(
      `Processing account ${account.index} (${account.id}) for wallet ${wallet.type}`
    )

    // Log current address state
    console.log(`📍 [Account Processing] Current address state:`)
    console.log(`   - AVM Address: ${account.addressAVM || 'Not set'}`)
    console.log(`   - PVM Address: ${account.addressPVM || 'Not set'}`)
    console.log(
      `   - Current XP Addresses: ${account.xpAddresses?.length || 0}`
    )
    console.log(
      `   - Current XP Dictionary entries: ${
        Object.keys(account.xpAddressDictionary || {}).length
      }`
    )

    Logger.info(
      `Current addresses - AVM: ${account.addressAVM}, PVM: ${account.addressPVM}`
    )

    if (restrictToFirstIndex && account.index !== 0) {
      console.log(
        `⏭️  [Account Processing] Skipping hardware wallet account ${account.index} - device connection required`
      )
      Logger.info(
        `Skipping hardware wallet account ${account.index} until device connection`
      )

      updatedAccounts[account.id] = {
        ...account,
        addressAVM: undefined,
        addressPVM: undefined,
        xpAddresses: [],
        xpAddressDictionary: {}
      }

      console.log(
        `✅ [Account Processing] Account ${account.index} skipped successfully`
      )
      continue
    }

    let xpAddresses: AddressIndex[] = []
    let xpAddressDictionary: XPAddressDictionary = {} as XPAddressDictionary
    let derivationSuccessful = false

    try {
      console.log(
        `🔍 [XP Derivation] Starting XP address derivation for account ${account.index}`
      )
      console.log(`🔧 [XP Derivation] Parameters:`)
      console.log(`   - isDeveloperMode: ${isDeveloperMode}`)
      console.log(`   - walletId: ${wallet.id}`)
      console.log(`   - walletType: ${wallet.type}`)
      console.log(`   - accountIndex: ${account.index}`)
      console.log(`   - onlyWithActivity: true`)

      Logger.info(`Deriving XP addresses for account ${account.index}...`)

      const derivationStartTime = Date.now()
      const result = await getAddressesFromXpubXP({
        isDeveloperMode,
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index,
        onlyWithActivity: true
      })
      const derivationDuration = Date.now() - derivationStartTime

      xpAddresses = result.xpAddresses
      xpAddressDictionary = result.xpAddressDictionary
      derivationSuccessful = true

      console.log(
        `✅ [XP Derivation] XP address derivation completed successfully in ${derivationDuration}ms`
      )
      console.log(`📊 [XP Derivation] Results:`)
      console.log(`   - XP Addresses found: ${xpAddresses.length}`)
      console.log(
        `   - Dictionary entries: ${Object.keys(xpAddressDictionary).length}`
      )

      if (xpAddresses.length > 0) {
        console.log(`📝 [XP Derivation] First few XP addresses:`)
        xpAddresses.slice(0, 5).forEach((addr, idx) => {
          console.log(`   ${idx + 1}. ${addr.address} (index: ${addr.index})`)
        })
        if (xpAddresses.length > 5) {
          console.log(`   ... and ${xpAddresses.length - 5} more`)
        }
      }

      // Log dictionary sample
      const dictKeys = Object.keys(xpAddressDictionary)
      if (dictKeys.length > 0) {
        console.log(`🗺️ [XP Derivation] Dictionary sample (first 3 entries):`)
        dictKeys.slice(0, 3).forEach(key => {
          const entry = xpAddressDictionary[key]
          if (entry) {
            console.log(
              `   ${key}: space=${entry.space}, index=${entry.index}, hasActivity=${entry.hasActivity}`
            )
          }
        })
      }
    } catch (error) {
      const derivationDuration = Date.now() - accountStartTime
      console.log(
        `❌ [XP Derivation] Failed to derive XP addresses for account ${account.index} after ${derivationDuration}ms`
      )
      console.log(`💥 [XP Derivation] Error details:`, error)

      Logger.error(
        `Failed to derive XP addresses for account ${account.index} in wallet ${wallet.id}`,
        error
      )

      walletHasErrors = true

      // Continue with empty addresses to ensure account is still updated
      console.log(
        `🔄 [XP Derivation] Continuing migration with empty XP addresses for account ${account.index}`
      )
    }

    // For mnemonic wallets, rederive AVM and PVM addresses
    let newAddressAVM = account.addressAVM
    let newAddressPVM = account.addressPVM
    
    if (wallet.type === WalletType.MNEMONIC) {
      console.log(`🔄 [Address Rederivation] Rederiving AVM/PVM addresses for mnemonic wallet account ${account.index}`)
      
      try {
        const rederivationStartTime = Date.now()
        const rederived = await AccountsService.getAddresses({
          walletId: wallet.id,
          walletType: wallet.type,
          accountIndex: account.index,
          isTestnet: isDeveloperMode
        })
        const rederivationDuration = Date.now() - rederivationStartTime
        
        newAddressAVM = rederived[NetworkVMType.AVM]
        newAddressPVM = rederived[NetworkVMType.PVM]
        
        console.log(`✅ [Address Rederivation] Successfully rederived addresses in ${rederivationDuration}ms`)
        console.log(`📍 [Address Rederivation] Address changes:`)
        console.log(`   - AVM: ${account.addressAVM || 'null'} → ${newAddressAVM || 'null'}`)
        console.log(`   - PVM: ${account.addressPVM || 'null'} → ${newAddressPVM || 'null'}`)
        
        if (account.addressAVM !== newAddressAVM) {
          console.log(`🔄 [Address Rederivation] AVM address changed for account ${account.index}`)
        }
        if (account.addressPVM !== newAddressPVM) {
          console.log(`🔄 [Address Rederivation] PVM address changed for account ${account.index}`)
        }
        
      } catch (error) {
        console.log(`❌ [Address Rederivation] Failed to rederive addresses for account ${account.index}:`, error)
        Logger.error(`Failed to rederive AVM/PVM addresses for account ${account.index}`, error)
        // Continue with existing addresses if rederivation fails
      }
    }

    // Always update the account, even if derivation failed
    const beforeXpCount = account.xpAddresses?.length || 0
    const beforeDictCount = Object.keys(
      account.xpAddressDictionary || {}
    ).length

    updatedAccounts[account.id] = {
      ...account,
      addressAVM: newAddressAVM,
      addressPVM: newAddressPVM,
      xpAddresses,
      xpAddressDictionary
    }

    const afterXpCount = xpAddresses.length
    const afterDictCount = Object.keys(xpAddressDictionary).length
    const accountDuration = Date.now() - accountStartTime

    console.log(`🔄 [Account Processing] Account ${account.index} updated:`)
    console.log(
      `   - XP Addresses: ${beforeXpCount} → ${afterXpCount} (${
        afterXpCount - beforeXpCount >= 0 ? '+' : ''
      }${afterXpCount - beforeXpCount})`
    )
    console.log(
      `   - Dictionary entries: ${beforeDictCount} → ${afterDictCount} (${
        afterDictCount - beforeDictCount >= 0 ? '+' : ''
      }${afterDictCount - beforeDictCount})`
    )
    console.log(`   - Processing time: ${accountDuration}ms`)
    console.log(
      `   - Status: ${
        derivationSuccessful
          ? '✅ Success'
          : '❌ Failed (continued with empty data)'
      }`
    )
  }

  const walletDuration = Date.now() - walletStartTime
  console.log(
    `\n🏁 [Wallet Processing] Wallet ${wallet.id} processing completed`
  )
  console.log(
    `⏱️  [Wallet Processing] Total wallet processing time: ${walletDuration}ms`
  )
  console.log(
    `📊 [Wallet Processing] Wallet status: ${
      walletHasErrors ? '❌ Had errors' : '✅ Successful'
    }`
  )

  return walletHasErrors
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
