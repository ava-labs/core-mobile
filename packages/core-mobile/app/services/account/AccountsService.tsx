import WalletService from 'services/wallet/WalletService'
import { Account, AccountCollection } from 'store/account'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { CoreAccountType, WalletType as CoreWalletType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { WalletType } from 'services/wallet/types'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { getAccountIndex } from 'store/account/utils'

class AccountsService {
  /**
   * Reloads the accounts for the given network.
   * @param accounts The accounts to reload.
   * @param network The network to reload the accounts for.
   * @returns The reloaded accounts.
   */
  async reloadAccounts(
    accounts: AccountCollection,
    network: Network
  ): Promise<AccountCollection> {
    const reloadedAccounts: AccountCollection = {}

    for (const id of Object.keys(accounts)) {
      const account = accounts[id]
      if (!account) continue

      let addresses
      let title = account.name

      if (account.type === CoreAccountType.PRIMARY) {
        addresses = await WalletService.getAddresses(
          getAccountIndex(account),
          network
        )
        if (account.walletType === CoreWalletType.Seedless) {
          title =
            (await SeedlessService.getAccountName(getAccountIndex(account))) ??
            account.name
        }
      } else {
        addresses = await WalletService.getAddresses(0, network)
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
