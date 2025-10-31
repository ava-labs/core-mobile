import { Account, AccountCollection } from 'store/account'
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
   * Reloads the accounts for the given network.
   * @param accounts The accounts to reload.
   * @param network The network to reload the accounts for.
   * @param walletId The wallet ID to reload the accounts for.
   * @param walletType The wallet type to reload the accounts for.
   * @returns The reloaded accounts.
   */
  async reloadAccounts({
    accounts,
    isTestnet,
    walletId,
    walletType
  }: {
    accounts: Account[]
    isTestnet: boolean
    walletId: string
    walletType: WalletType
  }): Promise<Account[]> {
    const reloadedAccounts: Account[] = []

    for (const account of accounts) {
      const addresses = await this.getAddresses({
        walletId,
        walletType,
        accountIndex: account.index,
        isTestnet
      })

      const title =
        walletType === WalletType.SEEDLESS
          ? await SeedlessService.getAccountName(account.index)
          : account.name

      reloadedAccounts.push({
        id: account.id,
        name: title ?? account.name,
        type: account.type,
        walletId: account.walletId,
        index: account.index,
        addressBTC: addresses[NetworkVMType.BITCOIN],
        addressC: addresses[NetworkVMType.EVM],
        addressAVM: addresses[NetworkVMType.AVM],
        addressPVM: addresses[NetworkVMType.PVM],
        addressCoreEth: addresses[NetworkVMType.CoreEth],
        addressSVM: addresses[NetworkVMType.SVM]
      } as Account)
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
  }): Promise<Account> {
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
    } else if (walletType === WalletType.LEDGER) {
      // For BIP44 Ledger wallets, try to derive addresses from extended public keys
      // This avoids the need to connect to the device for new accounts
      const wallet = await WalletFactory.createWallet({
        walletId,
        walletType
      })

      if (wallet instanceof LedgerWallet && wallet.isBIP44()) {
        // Try to derive addresses from extended public keys
        const evmAddress = wallet.deriveAddressFromXpub(
          index,
          NetworkVMType.EVM,
          isTestnet
        )
        const btcAddress = wallet.deriveAddressFromXpub(
          index,
          NetworkVMType.BITCOIN,
          isTestnet
        )

        if (evmAddress && btcAddress) {
          // We can derive EVM and Bitcoin addresses from xpubs
          Logger.info(`Derived addresses from xpub for account ${index}:`, {
            evm: evmAddress,
            btc: btcAddress
          })
        }
      }
    }

    const addresses = await this.getAddresses({
      walletId,
      walletType,
      accountIndex: index,
      isTestnet
    })

    Logger.info(`Final addresses for account ${index}:`, addresses)

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

    return ModuleManager.deriveAddresses({
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
      const acc = await this.createNextAccount({
        index: i,
        walletType,
        isTestnet: false,
        walletId,
        name
      })
      accounts[acc.id] = acc
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
