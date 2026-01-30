import { Account, AccountCollection, XPAddressDictionary } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { AddressIndex, CoreAccountType } from '@avalabs/types'
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
import { getAddressesFromXpubXP } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'

class AccountsService {
  /**
   * Gets addresses for an account, either preserving existing ones for Ledger or deriving new ones.
   */
  private async getAccountAddresses({
    account,
    isLedgerWallet,
    walletId,
    walletType,
    isTestnet
  }: {
    account: Account
    isLedgerWallet: boolean
    walletId: string
    walletType: WalletType
    isTestnet: boolean
  }): Promise<Record<NetworkVMType, string>> {
    if (isLedgerWallet) {
      // For Ledger wallets, preserve existing addresses
      // since they were retrieved from the device during wallet creation
      return {
        [NetworkVMType.BITCOIN]: account.addressBTC,
        [NetworkVMType.EVM]: account.addressC,
        [NetworkVMType.AVM]: account.addressAVM,
        [NetworkVMType.PVM]: account.addressPVM,
        [NetworkVMType.CoreEth]: account.addressCoreEth || '',
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
   * Gets XP addresses for an account, either preserving existing ones for Ledger or deriving new ones.
   */
  // private async getAccountXPAddresses({
  //   account,
  //   isLedgerWallet,
  //   walletId,
  //   walletType,
  //   isTestnet
  // }: {
  //   account: Account
  //   isLedgerWallet: boolean
  //   walletId: string
  //   walletType: WalletType
  //   isTestnet: boolean
  // }): Promise<{
  //   xpAddresses: AddressIndex[]
  //   xpAddressDictionary: XPAddressDictionary
  // }> {
  //   if (isLedgerWallet) {
  //     // For Ledger wallets, preserve existing XP addresses
  //     return {
  //       xpAddresses: account.xpAddresses || [],
  //       xpAddressDictionary:
  //         account.xpAddressDictionary || ({} as XPAddressDictionary)
  //     }
  //   }

  //   // For non-Ledger wallets, derive XP addresses
  //   try {
  //     const result = await getAddressesFromXpubXP({
  //       isDeveloperMode: isTestnet,
  //       walletId,
  //       walletType,
  //       accountIndex: account.index,
  //       onlyWithActivity: true
  //     })

  //     return {
  //       xpAddresses: result.xpAddresses,
  //       xpAddressDictionary: result.xpAddressDictionary
  //     }
  //   } catch (error) {
  //     Logger.error('Error getting XP addresses', error)
  //     return {
  //       xpAddresses: [],
  //       xpAddressDictionary: {} as XPAddressDictionary
  //     }
  //   }
  // }

  /**
   * Gets the account name/title.
   */
  // private async getAccountTitle(
  //   walletType: WalletType,
  //   account: Account
  // ): Promise<string> {
  //   if (walletType === WalletType.SEEDLESS) {
  //     return (
  //       (await SeedlessService.getAccountName(account.index)) ?? account.name
  //     )
  //   }
  //   return account.name
  // }

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
    accounts: AccountCollection
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
        isLedgerWallet,
        walletId,
        walletType,
        isTestnet
      })

      const strippedAVM = stripAddressPrefix(account.addressAVM)
      let xpAddresses: AddressIndex[] = [{ address: strippedAVM, index: 0 }]
      let xpAddressDictionary: XPAddressDictionary = {
        [strippedAVM]: { space: 'e', index: 0, hasActivity: false }
      }
      let hasMigratedXpAddresses = false

      try {
        const result = await getAddressesFromXpubXP({
          isDeveloperMode: isTestnet,
          walletId,
          walletType,
          accountIndex: account.index,
          onlyWithActivity: true
        })

        xpAddresses =
          result.xpAddresses.length > 0 ? result.xpAddresses : xpAddresses
        xpAddressDictionary = result.xpAddressDictionary
        hasMigratedXpAddresses = true
      } catch (error) {
        Logger.error('Error getting XP addresses', error)
      }

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
        addressSVM: addresses[NetworkVMType.SVM],
        xpAddresses,
        xpAddressDictionary,
        hasMigratedXpAddresses
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

        // Log if we can derive EVM and Bitcoin addresses from xpubs
        evmAddress &&
          btcAddress &&
          Logger.info(`Derived addresses from xpub for account ${index}:`, {
            evm: evmAddress,
            btc: btcAddress
          })
      }
    }

    const addresses = await this.getAddresses({
      walletId,
      walletType,
      accountIndex: index,
      isTestnet
    })

    let xpAddresses: AddressIndex[] = [
      { address: stripAddressPrefix(addresses[NetworkVMType.AVM]), index: 0 }
    ]
    let xpAddressDictionary: XPAddressDictionary = {} as XPAddressDictionary
    let hasMigratedXpAddresses = false
    try {
      const result = await getAddressesFromXpubXP({
        isDeveloperMode: isTestnet,
        walletId,
        walletType,
        accountIndex: index,
        onlyWithActivity: true
      })

      xpAddresses =
        result.xpAddresses.length > 0 ? result.xpAddresses : xpAddresses
      xpAddressDictionary = result.xpAddressDictionary
      hasMigratedXpAddresses = true
    } catch (error) {
      Logger.error('Error getting XP addresses', error)
    }

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
      addressSVM: addresses[NetworkVMType.SVM],
      xpAddresses,
      xpAddressDictionary,
      hasMigratedXpAddresses
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
