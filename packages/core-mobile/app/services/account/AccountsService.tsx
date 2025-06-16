import WalletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
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
    network,
    walletId,
    walletType
  }: {
    accounts: AccountCollection
    network: Network
    walletId: string
    walletType: WalletType
  }): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const id of Object.keys(accounts)) {
      const account = accounts[id]
      if (!account || account.walletId !== walletId) continue

      let addresses
      let title = account.name

      if (account.type === CoreAccountType.PRIMARY) {
        addresses = await WalletService.getAddresses({
          walletId,
          walletType,
          accountIndex: account.index,
          network
        })
        if (walletType === WalletType.SEEDLESS) {
          //FIXME: is seedless primary?
          title =
            (await SeedlessService.getAccountName(account.index)) ??
            account.name
        }
      } else {
        addresses = await WalletService.getAddresses({
          walletId,
          walletType,
          accountIndex: account.index,
          network
        })
      }

      reloadedAccounts[id] = {
        ...account,
        name: title ?? account.name,
        addressBTC: addresses[NetworkVMType.BITCOIN],
        addressC: addresses[NetworkVMType.EVM],
        addressAVM: addresses[NetworkVMType.AVM],
        addressPVM: addresses[NetworkVMType.PVM],
        addressCoreEth: addresses[NetworkVMType.CoreEth]
      }
    }

    return reloadedAccounts
  }

  async createNextAccount({
    index,
    walletType,
    network,
    walletId
  }: {
    index: number
    walletType: WalletType
    network: Network
    walletId: string
  }): Promise<Account> {
    if (walletType === WalletType.UNSET) throw new Error('invalid wallet type')

    const addresses = await WalletService.addAddress({
      walletId,
      walletType,
      accountIndex: index,
      network
    })

    return {
      index,
      id: uuid(),
      walletId,
      name: `Account ${index + 1}`,
      type: CoreAccountType.PRIMARY,
      addressBTC: addresses[NetworkVMType.BITCOIN],
      addressC: addresses[NetworkVMType.EVM],
      addressAVM: addresses[NetworkVMType.AVM],
      addressPVM: addresses[NetworkVMType.PVM],
      addressCoreEth: addresses[NetworkVMType.CoreEth]
    }
  }
}

export default new AccountsService()
