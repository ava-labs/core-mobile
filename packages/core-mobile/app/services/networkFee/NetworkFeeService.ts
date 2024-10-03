import { Network } from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { NetworkFee } from 'services/networkFee/types'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

class NetworkFeeService {
  async getNetworkFee(network: Network): Promise<NetworkFee | undefined> {
    const module = await ModuleManager.loadModuleByNetwork(network)
    const networkFees = await module.getNetworkFee(mapToVmNetwork(network))
    return {
      baseFee: networkFees.baseFee,
      low: {
        maxFeePerGas: networkFees.low.maxFeePerGas,
        maxPriorityFeePerGas: networkFees.low.maxPriorityFeePerGas
          ? networkFees.low.maxPriorityFeePerGas
          : undefined
      },
      medium: {
        maxFeePerGas: networkFees.medium.maxFeePerGas,
        maxPriorityFeePerGas: networkFees.medium.maxPriorityFeePerGas ?? 0n
      },
      high: {
        maxFeePerGas: networkFees.high.maxFeePerGas,
        maxPriorityFeePerGas: networkFees.high.maxPriorityFeePerGas ?? 0n
      },
      isFixedFee: networkFees.isFixedFee
    }
  }
}

export default new NetworkFeeService()
