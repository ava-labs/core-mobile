import { Network } from '@avalabs/core-chains-sdk'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
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

  // Hypercore spot tokens are not contract tokens (no EVM address) and are
  // not supported by this app's token pipeline.
  return (tokens ?? []).filter(
    (token): token is NetworkContractToken =>
      token.type !== TokenType.HYPERCORE_SPOT
  )
}
