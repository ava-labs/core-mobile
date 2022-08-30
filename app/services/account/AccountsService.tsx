import walletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

class AccountsService {
  async reloadAccounts(isTestnet: boolean, accounts: AccountCollection) {
    const reloadedAccounts: AccountCollection = {}

    for (const index of Object.keys(accounts)) {
      const key = parseInt(index)
      const addresses = await walletService.getAddress(key, isTestnet)

      reloadedAccounts[key] = {
        ...accounts[key],
        addressBtc: addresses[NetworkVMType.BITCOIN],
        address: addresses[NetworkVMType.EVM]
      }
    }

    return reloadedAccounts
  }

  async createNextAccount(isTestnet: boolean, accounts: AccountCollection) {
    const newIndex = Object.keys(accounts).length
    const addresses = await walletService.getAddress(newIndex, isTestnet)

    return {
      index: newIndex,
      title: `Account ${newIndex + 1}`,
      addressBtc: addresses[NetworkVMType.BITCOIN],
      address: addresses[NetworkVMType.EVM]
    } as Account
  }

  getAddressForNetwork(account: Account, network: Network) {
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
