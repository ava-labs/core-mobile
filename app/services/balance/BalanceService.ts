import { Balance, TokenWithBalance } from 'store/balance'
import NetworkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { Account } from 'store/account'
import AccountsService from 'services/account/AccountsService'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import BtcBalanceService from './BtcBalanceService'
import EvmBalanceService from './EvmBalanceService'

const serviceMap = {
  [NetworkVMType.BITCOIN]: BtcBalanceService,
  [NetworkVMType.EVM]: EvmBalanceService
}

type ServiceMap = typeof serviceMap
type Keys = keyof ServiceMap

class BalanceServiceFactory {
  static getService(k: Keys) {
    return serviceMap[k]
  }
}
export class BalanceService {
  private getBalanceServiceForNetwork(network: Network) {
    const balanceService = BalanceServiceFactory.getService(network.vmName)

    if (!balanceService)
      throw new Error(`no balance service found for network ${network.chainId}`)

    return balanceService
  }

  async getBalancesForAccount(
    network: Network,
    account: Account,
    currency: string
  ): Promise<{
    balance: Balance
    address: string
  }> {
    const address = AccountsService.getAddressForNetwork(account, network)
    const provider = NetworkService.getProviderForNetwork(network)
    const balanceService = this.getBalanceServiceForNetwork(network)
    const tokens = await balanceService.getBalances(
      network,
      provider as JsonRpcBatchInternal & BlockCypherProvider,
      address,
      currency
    )
    return {
      balance: {
        accountIndex: account.index,
        chainId: network.chainId,
        tokens
      },
      address
    }
  }

  async getBalancesForAddress(
    network: Network,
    address: string,
    currency: string
  ): Promise<TokenWithBalance[]> {
    const provider = NetworkService.getProviderForNetwork(network)
    const balanceService = this.getBalanceServiceForNetwork(network)

    return balanceService.getBalances(
      network,
      provider as JsonRpcBatchInternal & BlockCypherProvider,
      address,
      currency
    )
  }
}

export default new BalanceService()
