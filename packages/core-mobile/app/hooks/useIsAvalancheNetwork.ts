import { ChainId } from '@avalabs/chains-sdk'
import { useNetworks } from './useNetworks'

export const useIsAvalancheNetwork = (): boolean => {
  const { selectActiveNetwork } = useNetworks()
  const network = selectActiveNetwork()

  return [ChainId.AVALANCHE_TESTNET_ID, ChainId.AVALANCHE_MAINNET_ID].includes(
    network.chainId
  )
}
