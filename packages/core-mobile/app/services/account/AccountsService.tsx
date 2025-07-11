import WalletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { WalletType } from 'services/wallet/types'

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
    accounts: AccountCollection
    isTestnet: boolean
    walletId: string
    walletType: WalletType
  }): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const [key, account] of Object.entries(accounts)) {
      const addresses = await WalletService.getAddresses({
        walletId,
        walletType,
        accountIndex: account.index,
        isTestnet
      })

      const title =
        walletType === WalletType.SEEDLESS
          ? await SeedlessService.getAccountName(account.index)
          : account.name

      reloadedAccounts[key] = {
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

    const addresses = await WalletService.addAddress({
      walletId,
      walletType,
      accountIndex: index,
      isTestnet
    })

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
}

export default new AccountsService()
