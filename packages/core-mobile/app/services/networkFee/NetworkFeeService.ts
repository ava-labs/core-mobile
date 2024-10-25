import { Network } from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { NetworkFee } from 'services/networkFee/types'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

class NetworkFeeService {
  async getNetworkFee(network: Network): Promise<NetworkFee> {
    const caipId = ModuleManager.convertChainIdToCaip2(network)
    const module = await ModuleManager.loadModuleByNetwork(network)
    return await module.getNetworkFee({
      ...mapToVmNetwork(network),
      caipId
    })
  }
}

export default new NetworkFeeService()
