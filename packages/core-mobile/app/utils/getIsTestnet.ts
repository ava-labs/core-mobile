import { selectActiveChainId } from 'store/network'
import { RootState } from 'store'
import { getAllNetworks } from './getAllNetworks'

export const getIsTestnet = async (
  state: RootState
): Promise<boolean | undefined> => {
  const chainId = selectActiveChainId(state)
  const allNetworks = await getAllNetworks(state)
  const network = allNetworks[chainId]
  return network?.isTestnet
}
