import { Network, NetworkVM } from 'store/network'
import { TokenWithBalance } from 'store/balance'
import NetworkService from 'services/network/NetworkService'
import BtcBalanceService from './BtcBalanceService'
import EvmBalanceService from './EvmBalanceService'

const serviceMap = {
  [NetworkVM.BITCOIN]: BtcBalanceService,
  [NetworkVM.EVM]: EvmBalanceService
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
    const balanceService = BalanceServiceFactory.getService(network.vm)

    if (!balanceService)
      throw new Error(`no balance service found for network ${network.chainId}`)

    return balanceService
  }

  async getBalances(
    network: Network,
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    const provider = NetworkService.getProviderForNetwork(network)
    const balanceService = this.getBalanceServiceForNetwork(network)

    return balanceService.getBalances(network, provider as any, userAddress)
  }
}

export default new BalanceService()
