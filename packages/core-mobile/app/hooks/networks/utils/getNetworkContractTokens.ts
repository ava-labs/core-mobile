import { Network } from '@avalabs/core-chains-sdk'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { runAfterInteractions } from 'utils/runAfterInteractions'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export const getNetworkContractTokens = async (
  network: Network | undefined
): Promise<NetworkContractToken[]> => {
  if (!network) return []

  const module = await ModuleManager.loadModuleByNetwork(network)

  const tokens = await runAfterInteractions(async () => {
    return module.getTokens(mapToVmNetwork(network))
  })

  return tokens ?? []
}
