import { Networks, selectCustomNetworks } from 'store/network'
import { RootState } from 'store'
import { getNetworks } from './getNetworks'

export const getAllNetworks = async (state: RootState): Promise<Networks> => {
  const rawNetworks = await getNetworks()
  const customNetworks = selectCustomNetworks(state)
  return { ...rawNetworks, ...customNetworks }
}
