import { Network } from '@avalabs/chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export const getNetworkContractTokens = async (
  network: Network
): Promise<NetworkContractToken[]> => {
  const module = await ModuleManager.loadModuleByNetwork(network)

  return module.getTokens(mapToVmNetwork(network))
}
