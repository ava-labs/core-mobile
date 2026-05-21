import {
  Account,
  AccountCollection,
  LedgerAddressesCollection
} from 'store/account'
import {
  AvalancheCaip2ChainId,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  BitcoinCaip2ChainId,
  BlockchainNamespace,
  ChainId,
  Network,
  NetworkVMType,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'

import SeedlessService from 'seedless/services/SeedlessService'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { WalletType } from 'services/wallet/types'
import { emptyAddresses, isEvmPublicKey } from 'utils/publicKeys'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import WalletFactory from 'services/wallet/WalletFactory'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import ModuleManager from 'vmModule/ModuleManager'
import {
  AVALANCHE_MAINNET_NETWORK,
  AVALANCHE_TESTNET_NETWORK,
  NETWORK_P,
  NETWORK_P_TEST,
  NETWORK_SOLANA,
  NETWORK_SOLANA_DEVNET,
  NETWORK_X,
  NETWORK_X_TEST
} from 'services/network/consts'

import { defaultEnabledL2ChainIds } from 'services/network/consts'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import Logger from 'utils/Logger'
import SentryService from 'services/sentry/SentryService'
import { SentryTag } from 'services/sentry/types'
import { LedgerWallet } from 'services/wallet/LedgerWallet'
import WalletService from 'services/wallet/WalletService'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { streamingBalanceApiClient } from 'utils/api/clients/balanceApiClient'
import {
  AvalancheXpGetBalancesRequestItem,
  BtcGetBalancesRequestItem,
  EvmGetBalancesRequestItem,
  GetBalancesRequestBody,
  GetBalancesResponse,
  SvmGetBalancesRequestItem
} from 'utils/api/generated/balanceApi.client'

type ActivityStatus = 'active' | 'inactive' | 'unknown'
type DiscoveredSeedBasedAccount = {
  id: string
  index: number
  addresses: Record<NetworkVMType, string>
}

const DEFAULT_ACTIVITY_SCAN_WINDOW = 6
const INITIAL_ACTIVITY_SCAN_WINDOW = 2
const MAX_PARALLEL_ACTIVITY_CHECKS = 3
const MAX_PARALLEL_XPUB_LOOKUPS = 3
const TRANSACTION_HISTORY_PAGE_SIZE = 1
const DISCOVERY_BALANCE_CURRENCY = 'usd'

const extractCaip2Reference = (caip2Id: string): string => {
  const parts = caip2Id.split(':')
  return parts[1] ?? caip2Id
}

const normalizeAddressKey = (address: string, isEvm: boolean): string =>
  isEvm ? address.toLowerCase() : address

const isPositiveBalance = (value: string | undefined): boolean => {
  if (!value) {
    return false
  }

  try {
    return BigInt(value) > 0n
  } catch {
    return false
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const hasBalanceActivity = (response: GetBalancesResponse): boolean => {
  if (!('networkType' in response) || ('error' in response && response.error)) {
    return false
  }

  // The generated balance response is namespace-specific, so a small amount of
  // shape inspection here keeps discovery fast without over-modeling every variant.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balances = response.balances as any
  if (!balances) {
    return false
  }

  switch (response.networkType) {
    case 'evm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        (balances.erc20TokenBalances ?? []).some(
          (token: { balance?: string }) => isPositiveBalance(token.balance)
        )
      )

    case 'btc':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        isPositiveBalance(balances.nativeTokenBalance?.unconfirmedBalance)
      )

    case 'svm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        (balances.splTokenBalances ?? []).some((token: { balance?: string }) =>
          isPositiveBalance(token.balance)
        )
      )

    case 'avm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        [
          ...(balances.categories?.unlocked ?? []),
          ...(balances.categories?.locked ?? []),
          ...Object.values(
            balances.categories?.atomicMemoryUnlocked ?? {}
          ).flat(),
          ...Object.values(balances.categories?.atomicMemoryLocked ?? {}).flat()
        ].some((asset: { balance?: string }) =>
          isPositiveBalance(asset.balance)
        )
      )

    case 'pvm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        [
          balances.categories?.unlockedStaked,
          balances.categories?.unlockedUnstaked,
          balances.categories?.unlockedUnstakedMultiSig,
          balances.categories?.lockedStaked,
          balances.categories?.lockedPlatform,
          balances.categories?.lockedStakeable,
          ...Object.values(balances.categories?.atomicMemoryLocked ?? {}),
          ...Object.values(balances.categories?.atomicMemoryUnlocked ?? {})
        ].some(isPositiveBalance)
      )

    case 'coreth':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        (
          [
            ...Object.values(
              balances.categories?.atomicMemoryUnlocked ?? {}
            ).flat(),
            ...Object.values(
              balances.categories?.atomicMemoryLocked ?? {}
            ).flat()
          ] as Array<{ balance?: string }>
        ).some(asset => isPositiveBalance(asset.balance))
      )

    default:
      return false
  }
}

class AccountsService {
  /**
   * Gets addresses for an account, either preserving existing ones for Ledger or deriving new ones.
   */
  private async getAccountAddresses({
    account,
    ledgerAddressesCollection = {},
    isLedgerWallet,
    walletId,
    walletType,
    isTestnet
  }: {
    account: Account
    ledgerAddressesCollection?: LedgerAddressesCollection
    isLedgerWallet: boolean
    walletId: string
    walletType: WalletType
    isTestnet: boolean
  }): Promise<Record<NetworkVMType, string>> {
    if (isLedgerWallet) {
      const ledgerAddresses = ledgerAddressesCollection[account.id]

      const addressBTC = isTestnet
        ? ledgerAddresses?.testnet.addressBTC
        : ledgerAddresses?.mainnet.addressBTC

      const addressAVM = isTestnet
        ? ledgerAddresses?.testnet.addressAVM
        : ledgerAddresses?.mainnet.addressAVM

      const addressPVM = isTestnet
        ? ledgerAddresses?.testnet.addressPVM
        : ledgerAddresses?.mainnet.addressPVM

      const addressCoreEth = isTestnet
        ? ledgerAddresses?.testnet.addressCoreEth
        : ledgerAddresses?.mainnet.addressCoreEth
      // For Ledger wallets, preserve existing addresses
      // since they were retrieved from the device during wallet creation
      return {
        [NetworkVMType.BITCOIN]: addressBTC || '',
        [NetworkVMType.EVM]: account.addressC,
        [NetworkVMType.AVM]: addressAVM || '',
        [NetworkVMType.PVM]: addressPVM || '',
        [NetworkVMType.CoreEth]: addressCoreEth || '',
        [NetworkVMType.SVM]: account.addressSVM ?? ''
      } as Record<NetworkVMType, string>
    }

    // For other wallet types, derive addresses
    return this.getAddresses({
      walletId,
      walletType,
      accountIndex: account.index,
      isTestnet
    })
  }

  /**
   * Reloads the accounts for the given network.
   * @param accounts The accounts to reload.
   * @param network The network to reload the accounts for.
   * @param walletId The wallet ID to reload the accounts for.
   * @param walletType The wallet type to reload the accounts for.
   * @returns The reloaded accounts.
   */
  private resolveAddressC({
    derived,
    stored,
    accountIndex,
    walletId
  }: {
    derived: string | undefined
    stored: string | undefined
    accountIndex: number
    walletId: string
  }): string | undefined {
    if (!derived) {
      SentryService.captureMessage(
        '[AccountsService] reloadAccounts: EVM address derivation returned empty, falling back to stored addressC',
        { accountIndex, walletId, storedAddressC: stored },
        { source: SentryTag.AccountService }
      )
    }
    return derived || stored
  }

  async reloadAccounts({
    accounts,
    ledgerAddressesCollection = {},
    isTestnet,
    walletId,
    walletType
  }: {
    accounts: AccountCollection
    ledgerAddressesCollection?: LedgerAddressesCollection
    isTestnet: boolean
    walletId: string
    walletType: WalletType
  }): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}
    const isLedgerWallet =
      walletType === WalletType.LEDGER || walletType === WalletType.LEDGER_LIVE
    const accountEntries = Object.entries(accounts)

    // For non-Ledger wallets, derive addresses for all accounts in one
    // ModuleManager.deriveAllAddresses call instead of N sequential
    // getAddresses calls. Ledger wallets reuse stored addresses (no
    // derivation), so they stay on the per-account getAccountAddresses
    // path which just plucks from ledgerAddressesCollection.
    let derivedByIndex: Map<number, Record<NetworkVMType, string>> | undefined
    if (!isLedgerWallet && accountEntries.length > 0) {
      const batch = await ModuleManager.deriveAllAddresses({
        walletId,
        walletType,
        accountIndices: accountEntries.map(([, account]) => account.index),
        network: { isTestnet } as Network
      })
      // Defensive: deriveAllAddresses contracts to return one entry per
      // requested index, but enforce it at the boundary so a contract
      // violation throws here instead of silently overwriting account
      // addresses with `emptyAddresses()` in the loop below. Only EVM
      // would otherwise surface (via resolveAddressC's Sentry log);
      // BTC/AVM/PVM/SVM would zero out and persist with no signal.
      if (batch.length !== accountEntries.length) {
        throw new Error(
          `reloadAccounts: deriveAllAddresses returned ${batch.length} entries for ${accountEntries.length} accounts`
        )
      }
      derivedByIndex = new Map(
        batch.map(entry => [entry.accountIndex, entry.addresses])
      )
    }

    for (const [key, account] of accountEntries) {
      let addresses: Record<NetworkVMType, string>
      if (isLedgerWallet) {
        addresses = await this.getAccountAddresses({
          account,
          ledgerAddressesCollection,
          isLedgerWallet,
          walletId,
          walletType,
          isTestnet
        })
      } else {
        // Companion to the length check above — if a specific index is
        // missing from the batch result, treat it as a contract violation
        // rather than silently substituting empty addresses.
        const derived = derivedByIndex?.get(account.index)
        if (!derived) {
          throw new Error(
            `reloadAccounts: no derived addresses for accountIndex ${account.index}`
          )
        }
        addresses = derived
      }

      const addressC = this.resolveAddressC({
        derived: addresses[NetworkVMType.EVM],
        stored: account.addressC,
        accountIndex: account.index,
        walletId
      })

      reloadedAccounts[key] = {
        id: account.id,
        name: account.name,
        type: account.type,
        walletId: account.walletId,
        index: account.index,
        addressBTC: addresses[NetworkVMType.BITCOIN],
        addressC,
        addressAVM: addresses[NetworkVMType.AVM],
        addressPVM: addresses[NetworkVMType.PVM],
        addressCoreEth: addresses[NetworkVMType.CoreEth],
        addressSVM: addresses[NetworkVMType.SVM]
      } as Account
    }

    return reloadedAccounts
  }

  private buildPrimaryAccount({
    addresses,
    index,
    name,
    walletId
  }: {
    addresses: Record<NetworkVMType, string>
    index: number
    name: string
    walletId: string
  }): Account {
    return {
      index,
      id: uuid(),
      walletId,
      name,
      type: CoreAccountType.PRIMARY,
      addressBTC: addresses[NetworkVMType.BITCOIN],
      addressC: addresses[NetworkVMType.EVM],
      addressAVM: addresses[NetworkVMType.AVM],
      addressPVM: addresses[NetworkVMType.PVM],
      addressCoreEth: addresses[NetworkVMType.CoreEth],
      addressSVM: addresses[NetworkVMType.SVM]
    }
  }

  async createNextAccount({
    index,
    walletType,
    isTestnet,
    walletId,
    name
  }: {
    index: number
    walletType: WalletType
    isTestnet: boolean
    walletId: string
    name: string
  }): Promise<{
    account: Account
    xpub?: { evm: string; avalanche: string }
  }> {
    if (walletType === WalletType.UNSET) throw new Error('invalid wallet type')

    if (walletType === WalletType.SEEDLESS) {
      const storedPubKeys = await SeedlessPubKeysStorage.retrieve()
      const pubKeys = storedPubKeys.filter(isEvmPublicKey)

      const wallet = await WalletFactory.createWallet({
        walletId,
        walletType
      })

      // create next account only if it doesn't exist yet
      if (!pubKeys[index]) {
        if (!(wallet instanceof SeedlessWallet)) {
          throw new Error('Expected SeedlessWallet instance')
        }

        // prompt Core Seedless API to derive new keys
        await wallet.addAccount(index)
      }
    } else if (
      walletType === WalletType.LEDGER ||
      walletType === WalletType.LEDGER_LIVE
    ) {
      // For BIP44 Ledger wallets, get addresses and xpub from device
      // Device is already connected at this point
      const wallet = await WalletFactory.createWallet({
        walletId,
        walletType
      })
      if (!(wallet instanceof LedgerWallet)) {
        throw new Error('Expected LedgerWallet instance')
      }
      // Returns both account and xpub data
      return wallet.addAccount({ index, isTestnet, walletId, name })
    }

    const addresses = await this.getAddresses({
      walletId,
      walletType,
      accountIndex: index,
      isTestnet
    })

    Logger.info(`Final addresses for account ${index}:`, addresses)

    return {
      account: this.buildPrimaryAccount({
        addresses,
        index,
        name,
        walletId
      })
    }
  }

  async getAddresses({
    walletId,
    walletType,
    accountIndex,
    isTestnet
  }: {
    walletId: string
    walletType: WalletType
    accountIndex?: number
    isTestnet: boolean
  }): Promise<Record<NetworkVMType, string>> {
    // all vm modules need is just the isTestnet flag
    const network = {
      isTestnet
    } as Network

    const results = await ModuleManager.deriveAllAddresses({
      walletId,
      walletType,
      accountIndices: [accountIndex ?? 0],
      network
    })

    return results[0]?.addresses ?? emptyAddresses()
  }

  async getAccountName({
    walletType,
    accountIndex
  }: {
    walletType: WalletType
    accountIndex: number
  }): Promise<string> {
    const accountName = `Account ${accountIndex + 1}`
    if (walletType === WalletType.SEEDLESS) {
      return (await SeedlessService.getAccountName(accountIndex)) ?? accountName
    }

    return accountName
  }

  async fetchRemainingActiveAccounts({
    walletId,
    walletType,
    startIndex,
    onAccountCreated,
    scanWindow,
    isSolanaSupportBlocked,
    isDeveloperMode
  }: {
    walletId: string
    walletType: WalletType
    startIndex: number
    onAccountCreated?: (account: Account) => void
    scanWindow?: number
    isSolanaSupportBlocked: boolean
    isDeveloperMode?: boolean
  }): Promise<{ accounts: AccountCollection; completedCleanly: boolean }> {
    /**
     * note:
     * adding accounts cannot be parallelized, they need to be added one-by-one.
     * otherwise race conditions occur and addresses get mixed up.
     */
    const accounts: AccountCollection = {}

    if (
      walletType === WalletType.MNEMONIC ||
      walletType === WalletType.KEYSTONE
    ) {
      const discovery = await this.discoverSeedBasedActiveAccounts({
        walletId,
        walletType,
        startIndex,
        isSolanaSupportBlocked,
        isDeveloperMode,
        ...(scanWindow !== undefined && { scanWindow })
      })

      // Fill index gaps so accounts are contiguous from startIndex
      // to the highest discovered index. This prevents index collisions
      // when addAccount uses accountsByWalletId.length as the next index.
      const contiguousAccounts = await this.fillDiscoveredAccountGaps({
        discoveredAccounts: discovery.accounts,
        startIndex,
        walletId,
        walletType,
        isDeveloperMode
      })

      for (const discoveredAccount of contiguousAccounts) {
        const name = await this.getAccountName({
          walletType,
          accountIndex: discoveredAccount.index
        })
        const account = this.buildPrimaryAccount({
          addresses: discoveredAccount.addresses,
          index: discoveredAccount.index,
          name,
          walletId
        })
        accounts[account.id] = account
        onAccountCreated?.(account)
      }

      return { accounts, completedCleanly: discovery.completedCleanly }
    }

    const activeAccountsCount = await this.getSeedlessActiveAccountCount()

    // fetch the remaining accounts in the background
    for (let i = startIndex; i < activeAccountsCount; i++) {
      const name = await this.getAccountName({
        walletType,
        accountIndex: i
      })
      const result = await this.createNextAccount({
        index: i,
        walletType,
        isTestnet: false,
        walletId,
        name
      })
      accounts[result.account.id] = result.account
      onAccountCreated?.(result.account)
    }

    return { accounts, completedCleanly: true }
  }

  async getSeedlessActiveAccountCount(): Promise<number> {
    const pubKeys = await SeedlessPubKeysStorage.retrieve()
    return pubKeys.filter(isEvmPublicKey).length
  }

  /**
   * Ensures discovered accounts are contiguous from startIndex to the
   * highest active index by filling gaps with derived addresses.
   */
  private async fillDiscoveredAccountGaps({
    discoveredAccounts,
    startIndex,
    walletId,
    walletType,
    isDeveloperMode
  }: {
    discoveredAccounts: DiscoveredSeedBasedAccount[]
    startIndex: number
    walletId: string
    walletType: WalletType.MNEMONIC | WalletType.KEYSTONE
    isDeveloperMode?: boolean
  }): Promise<DiscoveredSeedBasedAccount[]> {
    if (discoveredAccounts.length === 0) {
      return discoveredAccounts
    }

    const maxIndex = Math.max(...discoveredAccounts.map(a => a.index))
    const byIndex = new Map(discoveredAccounts.map(a => [a.index, a]))

    // Collect every missing index first, then batch-derive them all in
    // one ModuleManager.deriveAllAddresses call instead of N sequential
    // getAddresses calls. Most discoveries have zero gaps, so this loop
    // is a no-op in the hot path; when gaps exist (e.g. transient
    // 'unknown' activity probes leaving non-contiguous indices), we
    // collapse N round-trips into 1.
    const gapIndices: number[] = []
    for (let idx = startIndex; idx <= maxIndex; idx++) {
      if (!byIndex.has(idx)) gapIndices.push(idx)
    }

    const gapAddressesByIndex = new Map<number, Record<NetworkVMType, string>>()
    if (gapIndices.length > 0) {
      const batch = await ModuleManager.deriveAllAddresses({
        walletId,
        walletType,
        accountIndices: gapIndices,
        network: { isTestnet: !!isDeveloperMode } as Network
      })
      batch.forEach(entry => {
        gapAddressesByIndex.set(entry.accountIndex, entry.addresses)
      })
    }

    const contiguous: DiscoveredSeedBasedAccount[] = []
    for (let idx = startIndex; idx <= maxIndex; idx++) {
      const existing = byIndex.get(idx)
      if (existing) {
        contiguous.push(existing)
        continue
      }
      const addresses = gapAddressesByIndex.get(idx)
      if (!addresses) {
        throw new Error(
          `fillDiscoveredAccountGaps: missing gap addresses for index ${idx}`
        )
      }
      contiguous.push({ id: `scan-${idx}`, index: idx, addresses })
    }

    return contiguous
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async discoverSeedBasedActiveAccounts({
    walletId,
    walletType,
    maxConsecutiveInactive = 2,
    startIndex = 1, // start from 1 because we assume the first account is always active
    maxScan = 1000,
    scanWindow = DEFAULT_ACTIVITY_SCAN_WINDOW,
    isSolanaSupportBlocked,
    isDeveloperMode
  }: {
    walletId: string
    walletType: WalletType.MNEMONIC | WalletType.KEYSTONE
    maxConsecutiveInactive?: number
    startIndex?: number
    maxScan?: number
    scanWindow?: number
    isSolanaSupportBlocked: boolean
    isDeveloperMode?: boolean
  }): Promise<{
    accounts: DiscoveredSeedBasedAccount[]
    completedCleanly: boolean
  }> {
    const discoveredAccounts: DiscoveredSeedBasedAccount[] = []
    let consecutiveInactive = 0
    let stoppedDueToError = false
    let i = startIndex
    let currentScanWindow = Math.min(
      scanWindow,
      Math.max(INITIAL_ACTIVITY_SCAN_WINDOW, maxConsecutiveInactive)
    )

    await ModuleManager.init()

    const network = { isTestnet: !!isDeveloperMode } as Network
    // Match the activity-probing network constants to the derivation
    // environment.  Without this, developer mode would derive fuji/tb1/devnet
    // addresses and then probe mainnet balance/glacier endpoints — funded
    // testnet accounts would be silently skipped as inactive.
    const evmNetwork = isDeveloperMode
      ? AVALANCHE_TESTNET_NETWORK
      : AVALANCHE_MAINNET_NETWORK
    const bitcoinNetwork = isDeveloperMode
      ? BITCOIN_TEST_NETWORK
      : BITCOIN_NETWORK
    const solanaNetwork = isDeveloperMode
      ? NETWORK_SOLANA_DEVNET
      : NETWORK_SOLANA
    const avmNetwork = isDeveloperMode ? NETWORK_X_TEST : NETWORK_X
    const pvmNetwork = isDeveloperMode ? NETWORK_P_TEST : NETWORK_P
    // Skip Solana module + vmNetwork construction when the Posthog gate is
    // off — saves the loadModuleByNetwork round-trip and downstream activity
    // probes have no module to call against.
    const [evmModule, bitcoinModule, solanaModule, avalancheModule] =
      await Promise.all([
        ModuleManager.loadModuleByNetwork(evmNetwork),
        ModuleManager.loadModuleByNetwork(bitcoinNetwork),
        isSolanaSupportBlocked
          ? Promise.resolve(undefined)
          : ModuleManager.loadModuleByNetwork(solanaNetwork),
        ModuleManager.loadModuleByNetwork(avmNetwork)
      ])

    const vmNetworks = {
      evm: mapToVmNetwork(evmNetwork),
      bitcoin: mapToVmNetwork(bitcoinNetwork),
      solana: isSolanaSupportBlocked
        ? undefined
        : mapToVmNetwork(solanaNetwork),
      avm: mapToVmNetwork(avmNetwork),
      pvm: mapToVmNetwork(pvmNetwork)
    }

    while (i < startIndex + maxScan) {
      const windowEnd = Math.min(i + currentScanWindow, startIndex + maxScan)
      const windowSize = windowEnd - i
      const windowIndices = Array.from({ length: windowSize }, (_, k) => i + k)

      // Batched derive: all-or-nothing per window. Per-account isolation
      // isn't meaningful — the realistic failure modes (wallet locked,
      // factory unavailable) fail every slot anyway. On failure we log,
      // mark the discovery as stopped due to error, and exit.
      let windowAccounts: DiscoveredSeedBasedAccount[]
      try {
        const batch = await ModuleManager.deriveAllAddresses({
          walletId,
          walletType,
          accountIndices: windowIndices,
          network
        })
        windowAccounts = windowIndices.map((index, k) => {
          const entry = batch[k]
          if (!entry) {
            throw new Error(
              `deriveAllAddresses returned no result for window slot ${k}`
            )
          }
          // When the Solana gate is off, drop the SVM address before it
          // flows into the balance batch (Solana namespace request) and
          // the secondary activity probe. The probe itself is already
          // gated; clearing here also keeps SVM out of the balance call
          // in getSeedBasedBalanceActiveAccountIds.
          const addresses = isSolanaSupportBlocked
            ? { ...entry.addresses, [NetworkVMType.SVM]: '' }
            : entry.addresses
          return { id: `scan-${index}`, index, addresses }
        })
      } catch (reason) {
        Logger.error('Error deriving addresses for account activity scan', {
          windowIndices,
          reason
        })
        stoppedDueToError = true
        break
      }

      const balanceActiveAccountIds =
        await this.getSeedBasedBalanceActiveAccountIds({
          walletId,
          walletType,
          accounts: windowAccounts
        })

      let shouldStop = false
      let foundActiveInWindow = false

      await processInOrderWithConcurrency({
        count: windowAccounts.length,
        concurrency: Math.min(MAX_PARALLEL_ACTIVITY_CHECKS, windowSize),
        task: async k => {
          const account = windowAccounts[k]
          if (!account) {
            return 'unknown' as const
          }

          if (balanceActiveAccountIds.has(account.id)) {
            return 'active' as const
          }

          return this.getSeedBasedActivityStatus({
            walletId,
            walletType,
            accountIndex: account.index,
            addresses: account.addresses,
            isTestnet: !!isDeveloperMode,
            modules: {
              evmModule,
              bitcoinModule,
              solanaModule,
              avalancheModule
            },
            vmNetworks
          })
        },
        onResult: async (status, k) => {
          if (status === 'unknown') {
            stoppedDueToError = true
            shouldStop = true
            return false
          }

          if (status === 'active') {
            const account = windowAccounts[k]
            if (!account) {
              stoppedDueToError = true
              shouldStop = true
              return false
            }
            foundActiveInWindow = true
            discoveredAccounts.push(account)
            consecutiveInactive = 0
            return true
          }

          consecutiveInactive++
          if (consecutiveInactive >= maxConsecutiveInactive) {
            shouldStop = true
            return false
          }

          return true
        }
      })

      if (shouldStop) break
      i = windowEnd
      if (foundActiveInWindow) {
        currentScanWindow = Math.min(
          scanWindow,
          Math.max(maxConsecutiveInactive, currentScanWindow * 2)
        )
      }
    }

    return {
      accounts: discoveredAccounts,
      completedCleanly: !stoppedDueToError
    }
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async getSeedBasedBalanceActiveAccountIds({
    walletId,
    walletType,
    accounts
  }: {
    walletId: string
    walletType: WalletType.MNEMONIC | WalletType.KEYSTONE
    accounts: DiscoveredSeedBasedAccount[]
  }): Promise<Set<string>> {
    if (accounts.length === 0) {
      return new Set()
    }

    const addressToAccountId = new Map<string, string>()
    const evmAddresses = new Set<string>()
    const btcAddresses = new Set<string>()
    const svmAddresses = new Set<string>()

    accounts.forEach(account => {
      const evmAddress = account.addresses[NetworkVMType.EVM]
      const btcAddress = account.addresses[NetworkVMType.BITCOIN]
      const svmAddress = account.addresses[NetworkVMType.SVM]

      if (evmAddress) {
        evmAddresses.add(evmAddress)
        addressToAccountId.set(
          normalizeAddressKey(evmAddress, true),
          account.id
        )
      }

      if (btcAddress) {
        btcAddresses.add(btcAddress)
        addressToAccountId.set(
          normalizeAddressKey(btcAddress, false),
          account.id
        )
      }

      if (svmAddress) {
        svmAddresses.add(svmAddress)
        addressToAccountId.set(
          normalizeAddressKey(svmAddress, false),
          account.id
        )
      }
    })

    const xpubCapableAccounts = accounts.filter(
      account =>
        walletType === WalletType.MNEMONIC ||
        (walletType === WalletType.KEYSTONE && account.index === 0)
    )

    const xpubResults = await runWithConcurrency({
      items: xpubCapableAccounts,
      concurrency: Math.min(
        MAX_PARALLEL_XPUB_LOOKUPS,
        xpubCapableAccounts.length
      ),
      task: async account => {
        try {
          return {
            status: 'fulfilled',
            value: {
              id: account.id,
              xpub: await WalletService.getRawXpubXP({
                walletId,
                walletType,
                accountIndex: account.index
              })
            }
          } as PromiseSettledResult<{ id: string; xpub: string }>
        } catch (reason) {
          return {
            status: 'rejected',
            reason
          } as PromiseSettledResult<{ id: string; xpub: string }>
        }
      }
    })

    const xpubAccountIds = new Set<string>()
    const avaxXpubDetails: Array<{ id: string; extendedPublicKey: string }> = []
    xpubResults.forEach(result => {
      if (result.status !== 'fulfilled') {
        return
      }

      xpubAccountIds.add(result.value.id)
      avaxXpubDetails.push({
        id: result.value.id,
        extendedPublicKey: result.value.xpub
      })
    })

    const avaxAddressDetails = accounts
      .filter(account => !xpubAccountIds.has(account.id))
      .map(account => {
        const xpAddress =
          account.addresses[NetworkVMType.PVM] ||
          account.addresses[NetworkVMType.AVM]

        if (!xpAddress) {
          return undefined
        }

        return {
          id: account.id,
          addresses: [stripAddressPrefix(xpAddress)]
        }
      })
      .filter(
        (
          detail
        ): detail is {
          id: string
          addresses: string[]
        } => detail !== undefined
      )

    const requestItems: GetBalancesRequestBody['data'] = []

    if (btcAddresses.size > 0) {
      requestItems.push({
        namespace: BlockchainNamespace.BIP122,
        addresses: [...btcAddresses],
        references: [extractCaip2Reference(BitcoinCaip2ChainId.MAINNET)]
      } as BtcGetBalancesRequestItem)
    }

    if (svmAddresses.size > 0) {
      requestItems.push({
        namespace: BlockchainNamespace.SOLANA,
        addresses: [...svmAddresses],
        references: [extractCaip2Reference(SolanaCaip2ChainId.MAINNET)]
      } as SvmGetBalancesRequestItem)
    }

    if (avaxXpubDetails.length > 0) {
      requestItems.push({
        namespace: BlockchainNamespace.AVAX,
        references: [
          extractCaip2Reference(AvalancheCaip2ChainId.X),
          extractCaip2Reference(AvalancheCaip2ChainId.P)
        ],
        filterOutDustUtxos: false,
        extendedPublicKeyDetails: avaxXpubDetails
      } as AvalancheXpGetBalancesRequestItem)
    }

    if (avaxAddressDetails.length > 0) {
      requestItems.push({
        namespace: BlockchainNamespace.AVAX,
        references: [
          extractCaip2Reference(AvalancheCaip2ChainId.X),
          extractCaip2Reference(AvalancheCaip2ChainId.P)
        ],
        filterOutDustUtxos: false,
        addressDetails: avaxAddressDetails
      } as AvalancheXpGetBalancesRequestItem)
    }

    if (evmAddresses.size > 0) {
      requestItems.push({
        namespace: BlockchainNamespace.EIP155,
        addresses: [...evmAddresses],
        references: [
          String(ChainId.AVALANCHE_MAINNET_ID),
          String(ChainId.ETHEREUM_HOMESTEAD),
          ...defaultEnabledL2ChainIds.map(String)
        ]
      } as EvmGetBalancesRequestItem)
    }

    if (requestItems.length === 0) {
      return new Set()
    }

    const activeAccountIds = new Set<string>()
    const knownAccountIds = new Set(accounts.map(account => account.id))

    try {
      for await (const response of streamingBalanceApiClient.getBalances({
        data: requestItems,
        currency: DISCOVERY_BALANCE_CURRENCY
      })) {
        if (!hasBalanceActivity(response)) {
          continue
        }

        const responseId = 'id' in response ? response.id : undefined
        if (!responseId) {
          continue
        }

        if (knownAccountIds.has(responseId)) {
          activeAccountIds.add(responseId)
          continue
        }

        const accountId = addressToAccountId.get(
          normalizeAddressKey(
            responseId,
            'networkType' in response && response.networkType === 'evm'
          )
        )

        if (accountId) {
          activeAccountIds.add(accountId)
        }
      }
    } catch (error) {
      Logger.error(
        'Failed to batch-check balances during account discovery',
        error
      )
    }

    return activeAccountIds
  }

  private async getSeedBasedActivityStatus({
    walletId,
    walletType,
    accountIndex,
    addresses,
    modules,
    vmNetworks,
    isTestnet,
    includeSecondaryProbes = true
  }: {
    walletId: string
    walletType: WalletType.MNEMONIC | WalletType.KEYSTONE
    accountIndex: number
    addresses: Record<NetworkVMType, string>
    isTestnet: boolean
    modules: {
      evmModule: Awaited<ReturnType<typeof ModuleManager.loadModuleByNetwork>>
      bitcoinModule: Awaited<
        ReturnType<typeof ModuleManager.loadModuleByNetwork>
      >
      // Undefined when the Solana Posthog gate is off — see
      // discoverSeedBasedActiveAccounts. The secondary probe below skips
      // Solana when either the module or network is missing.
      solanaModule:
        | Awaited<ReturnType<typeof ModuleManager.loadModuleByNetwork>>
        | undefined
      avalancheModule: Awaited<
        ReturnType<typeof ModuleManager.loadModuleByNetwork>
      >
    }
    vmNetworks: {
      evm: ReturnType<typeof mapToVmNetwork>
      bitcoin: ReturnType<typeof mapToVmNetwork>
      solana: ReturnType<typeof mapToVmNetwork> | undefined
      avm: ReturnType<typeof mapToVmNetwork>
      pvm: ReturnType<typeof mapToVmNetwork>
    }
    includeSecondaryProbes?: boolean
  }): Promise<ActivityStatus> {
    const primaryProbe = await this.runActivityProbes([
      this.hasTransactionHistory({
        module: modules.evmModule,
        network: vmNetworks.evm,
        address: addresses[NetworkVMType.EVM]
      }),
      this.hasAvalancheActivity({
        walletId,
        walletType,
        accountIndex,
        addresses,
        avalancheModule: modules.avalancheModule,
        avmNetwork: vmNetworks.avm,
        pvmNetwork: vmNetworks.pvm,
        isTestnet
      })
    ])

    if (primaryProbe.isActive) {
      return 'active'
    }

    if (!includeSecondaryProbes) {
      return primaryProbe.hadError ? 'unknown' : 'inactive'
    }

    const secondaryProbes: Promise<boolean>[] = [
      this.hasTransactionHistory({
        module: modules.bitcoinModule,
        network: vmNetworks.bitcoin,
        address: addresses[NetworkVMType.BITCOIN]
      })
    ]
    // Skip the Solana probe when the gate is off — both module and network
    // are undefined in that case (see discoverSeedBasedActiveAccounts).
    if (modules.solanaModule && vmNetworks.solana) {
      secondaryProbes.push(
        this.hasTransactionHistory({
          module: modules.solanaModule,
          network: vmNetworks.solana,
          address: addresses[NetworkVMType.SVM]
        })
      )
    }
    const secondaryProbe = await this.runActivityProbes(secondaryProbes)

    if (secondaryProbe.isActive) {
      return 'active'
    }

    return primaryProbe.hadError || secondaryProbe.hadError
      ? 'unknown'
      : 'inactive'
  }

  private async hasAvalancheActivity({
    walletId,
    walletType,
    accountIndex,
    addresses,
    avalancheModule,
    avmNetwork,
    pvmNetwork,
    isTestnet
  }: {
    walletId: string
    walletType: WalletType.MNEMONIC | WalletType.KEYSTONE
    accountIndex: number
    addresses: Record<NetworkVMType, string>
    avalancheModule: Awaited<
      ReturnType<typeof ModuleManager.loadModuleByNetwork>
    >
    avmNetwork: ReturnType<typeof mapToVmNetwork>
    pvmNetwork: ReturnType<typeof mapToVmNetwork>
    isTestnet: boolean
  }): Promise<boolean> {
    const canUseXpActivityLookup =
      walletType === WalletType.MNEMONIC ||
      (walletType === WalletType.KEYSTONE && accountIndex === 0)

    if (canUseXpActivityLookup) {
      return WalletService.hasActivityFromXpubXP({
        walletId,
        walletType,
        accountIndex,
        isTestnet
      })
    }

    const xpProbe = await this.runActivityProbes([
      this.hasTransactionHistory({
        module: avalancheModule,
        network: avmNetwork,
        address: addresses[NetworkVMType.AVM]
      }),
      this.hasTransactionHistory({
        module: avalancheModule,
        network: pvmNetwork,
        address: addresses[NetworkVMType.PVM]
      })
    ])

    if (xpProbe.hadError) {
      throw new Error('Avalanche activity fallback probe failed')
    }

    return xpProbe.isActive
  }

  private async hasTransactionHistory({
    module,
    network,
    address
  }: {
    module: Awaited<ReturnType<typeof ModuleManager.loadModuleByNetwork>>
    network: ReturnType<typeof mapToVmNetwork>
    address?: string
  }): Promise<boolean> {
    if (!address) {
      return false
    }

    const response = await module.getTransactionHistory({
      network,
      address,
      offset: TRANSACTION_HISTORY_PAGE_SIZE
    })

    return response.transactions.length > 0
  }

  private async runActivityProbes(
    probes: Promise<boolean>[]
  ): Promise<{ isActive: boolean; hadError: boolean }> {
    if (probes.length === 0) {
      return { isActive: false, hadError: false }
    }

    const wrappedResults = probes.map((probe, index) =>
      probe
        .then(value => ({
          index,
          value,
          hadError: false
        }))
        .catch(reason => {
          Logger.error('Error checking if account is active', reason)
          return {
            index,
            value: false,
            hadError: true
          }
        })
    )

    const remaining = new Set(wrappedResults.map((_, index) => index))
    let hadError = false

    while (remaining.size > 0) {
      const result = await Promise.race(
        [...remaining].map(
          index =>
            wrappedResults[index] as Promise<{
              index: number
              value: boolean
              hadError: boolean
            }>
        )
      )

      remaining.delete(result.index)
      hadError ||= result.hadError

      if (result.value) {
        return {
          isActive: true,
          hadError
        }
      }
    }

    return {
      isActive: false,
      hadError
    }
  }
}

const runWithConcurrency = async <TItem, TResult>({
  items,
  concurrency,
  task
}: {
  items: TItem[]
  concurrency: number
  task: (item: TItem, index: number) => Promise<TResult>
}): Promise<TResult[]> => {
  const results = new Array<TResult>(items.length)
  let nextIndex = 0

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex++
        results[currentIndex] = await task(
          items[currentIndex] as TItem,
          currentIndex
        )
      }
    })
  )

  return results
}

const processInOrderWithConcurrency = async <TResult,>({
  count,
  concurrency,
  task,
  onResult
}: {
  count: number
  concurrency: number
  task: (index: number) => Promise<TResult>
  onResult: (result: TResult, index: number) => Promise<boolean> | boolean
}): Promise<void> => {
  if (count === 0) {
    return
  }

  const scheduled = new Map<number, Promise<TResult>>()
  let nextIndexToSchedule = 0

  const scheduleNext = (): void => {
    if (nextIndexToSchedule >= count) {
      return
    }

    scheduled.set(nextIndexToSchedule, task(nextIndexToSchedule))
    nextIndexToSchedule++
  }

  const initialConcurrency = Math.min(concurrency, count)
  for (let i = 0; i < initialConcurrency; i++) {
    scheduleNext()
  }

  for (let index = 0; index < count; index++) {
    const result = await (scheduled.get(index) as Promise<TResult>)
    const shouldContinue = await onResult(result, index)

    if (!shouldContinue) {
      return
    }

    scheduleNext()
  }
}

export default new AccountsService()
