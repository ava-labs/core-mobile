import walletService from 'services/wallet/WalletService'
import { Account } from 'dto/Account'
import { AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

class AccountsService {
  //todo: refresh addresses in case the user switches to testnet the BTC address gets updated
  //todo: potentially just listening to "developer mode" change and re-loading the accounts
  async createNextAccount(network: Network, accounts: AccountCollection) {
    const newIndex = Object.keys(accounts).length
    const addresses = await walletService.getAddress(
      newIndex,
      !network.isTestnet
    )
    return {
      index: newIndex,
      title: `Account ${newIndex + 1}`,
      addressBtc: addresses[NetworkVMType.BITCOIN],
      address: addresses[NetworkVMType.EVM]
    } as Account
  }
}

export default new AccountsService()
