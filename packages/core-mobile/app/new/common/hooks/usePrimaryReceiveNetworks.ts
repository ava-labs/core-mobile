import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAIN_NETWORKS, TEST_NETWORKS } from 'services/network/consts'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'
import { selectNetworks } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export function usePrimaryReceiveNetworks(): {
  networks: Network[]
} {
  const allNetworks = useSelector(selectNetworks)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) {
      const testnetNetworks = TEST_NETWORKS.map(network => {
        if (network.chainId === ChainId.AVALANCHE_TESTNET_ID) {
          return {
            ...network,
            chainName: 'Avalanche C-Chain Testnet'
          }
        }
        return network
      })
      return [...testnetNetworks, ethereumNetwork] as Network[]
    }
    const mainnetNetworks = MAIN_NETWORKS.map(network => {
      if (network.chainId === ChainId.AVALANCHE_MAINNET_ID) {
        return {
          ...network,
          chainName: 'Avalanche C-Chain'
        }
      }
      return network
    })
    return [...mainnetNetworks, ethereumNetwork] as Network[]
  }, [ethereumNetwork, isDeveloperMode])

  return { networks }
}
