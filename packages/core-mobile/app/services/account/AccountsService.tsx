import {
  Account,
  AccountCollection,
  LedgerAddressesCollection
} from 'store/account'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { WalletType } from 'services/wallet/types'
import { isEvmPublicKey } from 'utils/publicKeys'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import WalletFactory from 'services/wallet/WalletFactory'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import ModuleManager from 'vmModule/ModuleManager'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import Logger from 'utils/Logger'
import { LedgerWallet } from 'services/wallet/LedgerWallet'

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
        [NetworkVMType.BITCOIN]: addressBTC || account.addressBTC,
        [NetworkVMType.EVM]: account.addressC,
        [NetworkVMType.AVM]: addressAVM || account.addressAVM,
        [NetworkVMType.PVM]: addressPVM || account.addressPVM,
        [NetworkVMType.CoreEth]: addressCoreEth || account.addressCoreEth || '',
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

    for (const [key, account] of Object.entries(accounts)) {
      const addresses = await this.getAccountAddresses({
        account,
        ledgerAddressesCollection,
        isLedgerWallet,
        walletId,
        walletType,
        isTestnet
      })

      reloadedAccounts[key] = {
        id: account.id,
        name: account.name,
        type: account.type,
        walletId: account.walletId,
        index: account.index,
        addressBTC: addresses[NetworkVMType.BITCOIN],
        addressC: addresses[NetworkVMType.EVM],
        addressAVM: addresses[NetworkVMType.AVM],
        addressPVM: addresses[NetworkVMType.PVM],
        addressCoreEth: addresses[NetworkVMType.CoreEth],
        addressSVM: addresses[NetworkVMType.SVM]
      } as Account
    }

    return reloadedAccounts
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
      account: {
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
        addressSVM: addresses[NetworkVMType.SVM],
        xpAddresses,
        xpAddressDictionary,
        hasMigratedXpAddresses
      }
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

    return await ModuleManager.deriveAddresses({
      walletId,
      walletType,
      accountIndex,
      network
    })
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
    startIndex
  }: {
    walletId: string
    walletType: WalletType.SEEDLESS | WalletType.MNEMONIC | WalletType.KEYSTONE
    startIndex: number
  }): Promise<AccountCollection> {
    /**
     * note:
     * adding accounts cannot be parallelized, they need to be added one-by-one.
     * otherwise race conditions occur and addresses get mixed up.
     */
    const activeAccountsCount = await this.getActiveAccountsCount({
      walletId,
      walletType
    })

    const accounts: AccountCollection = {}

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
    }

    return accounts
  }

  async getSeedlessActiveAccountCount(): Promise<number> {
    const pubKeys = await SeedlessPubKeysStorage.retrieve()
    return pubKeys.filter(isEvmPublicKey).length
  }

  private async getSeedBasedActiveAccountCount({
    walletId,
    walletType,
    maxConsecutiveInactive = 2,
    startIndex = 1, // start from 1 because we assume the first account is always active
    maxScan = 1000
  }: {
    walletId: string
    walletType: WalletType.MNEMONIC | WalletType.KEYSTONE
    maxConsecutiveInactive?: number
    startIndex?: number
    maxScan?: number
  }): Promise<number> {
    let consecutiveInactive = 0
    let lastActiveIndex: number | null = 0

    for (let i = startIndex; i < startIndex + maxScan; i++) {
      try {
        const isActive = await this.isAccountActive({
          walletId,
          walletType,
          accountIndex: i
        })

        if (isActive) {
          lastActiveIndex = i
          consecutiveInactive = 0
        } else {
          consecutiveInactive++
          if (consecutiveInactive >= maxConsecutiveInactive) break
        }
      } catch (error) {
        Logger.error('Error checking if account is active', error)
        break
      }
    }

    return Math.max(0, (lastActiveIndex ?? 0) + 1)
  }

  private async isAccountActive({
    walletId,
    walletType,
    accountIndex
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
  }): Promise<boolean> {
    const addresses = await this.getAddresses({
      walletId,
      walletType,
      accountIndex,
      isTestnet: false
    })

    const module = await ModuleManager.loadModuleByNetwork(
      AVALANCHE_MAINNET_NETWORK
    )

    const response = await module.getTransactionHistory({
      network: mapToVmNetwork(AVALANCHE_MAINNET_NETWORK),
      address: addresses[NetworkVMType.EVM]
    })

    return response.transactions.length > 0
  }

  private async getActiveAccountsCount({
    walletId,
    walletType
  }: {
    walletId: string
    walletType: WalletType
  }): Promise<number> {
    switch (walletType) {
      case WalletType.SEEDLESS:
        return this.getSeedlessActiveAccountCount()

      case WalletType.MNEMONIC:
      case WalletType.KEYSTONE:
        return this.getSeedBasedActiveAccountCount({ walletId, walletType })

      default:
        return 1
    }
  }
}

export default new AccountsService()
