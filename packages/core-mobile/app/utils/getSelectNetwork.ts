import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import { getAllNetworks } from './getAllNetworks'

export const getSelectNetwork = async (
  chainId: number,
  state: RootState
): Promise<Network | undefined> => {
  const allNetworks = await getAllNetworks(state)
  return allNetworks[chainId]
}
