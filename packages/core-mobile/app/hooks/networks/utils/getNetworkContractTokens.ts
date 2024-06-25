import { Network } from '@avalabs/chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'

export const getNetworkContractTokens = async (
  network: Network
): Promise<NetworkContractToken[]> => {
  const module = await ModuleManager.loadModuleByNetwork(network)

  return module.getTokens({ chainId: network.chainId, isProd: !__DEV__ })
}
