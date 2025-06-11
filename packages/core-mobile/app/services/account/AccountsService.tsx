import WalletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { CoreAccountType, WalletType as CoreWalletType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { WalletType } from 'services/wallet/types'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'

class AccountsService {
  async reloadAccounts(
    accounts: AccountCollection,
    network: Network
  ): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const index of Object.keys(accounts)) {
      const key = parseInt(index)
      const addresses = await WalletService.getAddresses({
        accountIndex: key,
        network
      })
      const title = await SeedlessService.getAccountName(key)

      const account = accounts[key]
      if (account) {
        reloadedAccounts[key] = {
          id: account.id,
          name: title ?? account.name,
          type: account.type,
          active: account.active,
          walletId: account.walletId,
          index: account.index,
          walletType: account.walletType,
          addressBTC: addresses[NetworkVMType.BITCOIN],
          addressC: addresses[NetworkVMType.EVM],
          addressAVM: addresses[NetworkVMType.AVM],
          addressPVM: addresses[NetworkVMType.PVM],
          addressCoreEth: addresses[NetworkVMType.CoreEth],
          walletName: account.walletName
        }
      }
    }

    return reloadedAccounts
  }

  async createNextAccount({
    index,
    activeAccountIndex,
    walletType,
    network
  }: {
    index: number
    activeAccountIndex: number
    walletType: WalletType
    network: Network
  }): Promise<Account> {
    if (walletType === WalletType.UNSET) throw new Error('invalid wallet type')

    const addresses = await WalletService.addAddress(index, network)

    return {
      index,
      id: uuid(),
      walletId: CORE_MOBILE_WALLET_ID,
      name: `Account ${index + 1}`,
      type: CoreAccountType.PRIMARY,
      active: index === activeAccountIndex,
      walletType:
        walletType === WalletType.MNEMONIC
          ? CoreWalletType.Mnemonic
          : CoreWalletType.Seedless,
      addressBTC: addresses[NetworkVMType.BITCOIN],
      addressC: addresses[NetworkVMType.EVM],
      addressAVM: addresses[NetworkVMType.AVM],
      addressPVM: addresses[NetworkVMType.PVM],
      addressCoreEth: addresses[NetworkVMType.CoreEth],
      walletName: ''
    }
  }
}

export default new AccountsService()
