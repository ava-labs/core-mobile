import walletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

class AccountsService {
  async reloadAccounts(
    isTestnet: boolean,
    accounts: AccountCollection
  ): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const index of Object.keys(accounts)) {
      const key = parseInt(index)
      const addresses = await walletService.getAddresses(key, isTestnet)

      const account = accounts[key]
      if (account) {
        reloadedAccounts[key] = {
          ...account,
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

  async createNextAccount(
    isTestnet: boolean,
    accounts: AccountCollection
  ): Promise<Account> {
    const newIndex = Object.keys(accounts).length
    const addresses = await walletService.getAddresses(newIndex, isTestnet)

    return {
      index: newIndex,
      title: `Account ${newIndex + 1}`,
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
