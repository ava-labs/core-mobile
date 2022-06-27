import { TokenWithBalance } from 'store/balance'
import NetworkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { Account } from 'store/account'
import AccountsService from 'services/account/AccountsService'
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
    accountIndex: number
    chainId: number
    address: string
    tokens: TokenWithBalance[]
  }> {
    const address = AccountsService.getAddressForNetwork(account, network)
    const provider = NetworkService.getProviderForNetwork(network)
    const balanceService = this.getBalanceServiceForNetwork(network)
    const tokens = await balanceService.getBalances(
      network,
      provider as any,
      address,
      currency
    )
    return {
      accountIndex: account.index,
      chainId: network.chainId,
      address,
      tokens
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
      provider as any,
      address,
      currency
    )
  }
}

export default new BalanceService()
