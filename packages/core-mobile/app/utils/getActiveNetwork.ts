import { defaultNetwork, selectActiveChainId } from 'store/network'
import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import { getSelectNetworks } from './getSelectNetworks'

export const getActiveNetwork = async (state: RootState): Promise<Network> => {
  const activeChainId = selectActiveChainId(state)
  const networks = await getSelectNetworks(state)

  if (networks === undefined) return defaultNetwork
  const network = networks[activeChainId]
  return network === undefined ? defaultNetwork : network
}
