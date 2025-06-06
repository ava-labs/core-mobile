import WalletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { CoreAccountType, WalletType as CoreWalletType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { WalletType } from 'services/wallet/types'

class AccountsService {
  async reloadAccounts(
    walletId: string,
    accounts: AccountCollection,
    isTestnet: boolean
  ): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const index of Object.keys(accounts)) {
      const key = parseInt(index)
      const addresses = await WalletService.getAddresses(
        walletId,
        key,
        isTestnet
      )
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
    walletId,
    index,
    activeAccountIndex,
    walletType,
    isTestnet
  }: {
    walletId: string
    index: number
    activeAccountIndex: number
    walletType: WalletType
    isTestnet: boolean
  }): Promise<Account> {
    if (walletType === WalletType.UNSET) throw new Error('invalid wallet type')

    const addresses = await WalletService.addAddress(walletId, index, isTestnet)

    return {
      index,
      id: uuid(),
      walletId,
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
