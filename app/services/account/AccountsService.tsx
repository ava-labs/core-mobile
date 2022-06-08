import walletService from 'services/wallet/WalletService'
import { Account } from 'dto/Account'
import { AccountCollection } from 'store/account'
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  Network
} from '@avalabs/chains-sdk'

class AccountsService {
  async createNextAccount(network: Network, accounts: AccountCollection) {
    const newIndex = Object.keys(accounts).length
    const addressBtc = (
      await walletService.getBtcWallet(
        newIndex,
        network.isTestnet ? BITCOIN_TEST_NETWORK : BITCOIN_NETWORK
      )
    ).getAddressBech32()
    const address = walletService.getEvmWallet(newIndex, network).address
    return {
      index: newIndex,
      title: `Account ${newIndex + 1}`,
      addressBtc,
      address
    } as Account
  }
}

export default new AccountsService()
