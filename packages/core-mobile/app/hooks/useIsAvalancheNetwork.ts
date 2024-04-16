import { ChainId } from '@avalabs/chains-sdk'
import { useNetworks } from './networks/useNetworks'

export const useIsAvalancheNetwork = (): boolean => {
  const { activeNetwork } = useNetworks()

  return [ChainId.AVALANCHE_TESTNET_ID, ChainId.AVALANCHE_MAINNET_ID].includes(
    activeNetwork.chainId
  )
}
