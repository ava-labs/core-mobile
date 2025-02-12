import { Network } from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { NetworkFees } from '@avalabs/vm-module-types'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

class NetworkFeeService {
  async getNetworkFee(network: Network): Promise<NetworkFees> {
    const caipId = ModuleManager.convertChainIdToCaip2(network)
    const module = await ModuleManager.loadModuleByNetwork(network)
    return await module.getNetworkFee({
      ...mapToVmNetwork(network),
      caipId
    })
  }
}

export default new NetworkFeeService()
