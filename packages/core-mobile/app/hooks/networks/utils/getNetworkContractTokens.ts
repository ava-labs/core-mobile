import { Network } from '@avalabs/core-chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export const getNetworkContractTokens = async (
  network: Network | undefined
): Promise<NetworkContractToken[]> => {
  if (!network) return []

  const module = await ModuleManager.loadModuleByNetwork(network)

  return module.getTokens(mapToVmNetwork(network))
}
