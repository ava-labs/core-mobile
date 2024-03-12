import WalletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'

class AccountsService {
  async reloadAccounts(
    isTestnet: boolean,
    accounts: AccountCollection
  ): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const index of Object.keys(accounts)) {
      const key = parseInt(index)
      const addresses = await WalletService.getAddresses(key, isTestnet)
      const title = await SeedlessService.getAccountName(key)

      const account = accounts[key]
      if (account) {
        reloadedAccounts[key] = {
          ...account,
          title: title ?? account.title,
          addressBtc: addresses[NetworkVMType.BITCOIN],
          address: addresses[NetworkVMType.EVM],
          addressAVM: addresses[NetworkVMType.AVM],
          addressPVM: addresses[NetworkVMType.PVM],
          addressCoreEth: addresses[NetworkVMType.CoreEth]
        }
      }
    }

    return reloadedAccounts
  }

  async createNextAccount(isTestnet: boolean, index: number): Promise<Account> {
    const addresses = await WalletService.addAddress(index, isTestnet)
    return {
      index,
      title: `Account ${index + 1}`,
      addressBtc: addresses[NetworkVMType.BITCOIN],
      address: addresses[NetworkVMType.EVM],
      addressAVM: addresses[NetworkVMType.AVM],
      addressPVM: addresses[NetworkVMType.PVM],
      addressCoreEth: addresses[NetworkVMType.CoreEth]
    } as Account
  }

  getAddressForNetwork(account: Account, network: Network): string {
    if (network.vmName === NetworkVMType.BITCOIN) {
      return account.addressBtc
    }

    if (network.vmName === NetworkVMType.EVM) {
      return account.address
    }

    throw new Error('unsupported network')
  }
}

export default new AccountsService()
