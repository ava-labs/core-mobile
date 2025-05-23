import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAIN_NETWORKS, TEST_NETWORKS } from 'services/network/consts'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'
import { selectNetworks } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

/**
 * Hook to get the primary networks based on the developer mode.
 * @returns {Object} An object containing the networks.
 */
export function usePrimaryNetworks(): {
  networks: Network[]
} {
  const allNetworks = useSelector(selectNetworks)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) {
      return [...TEST_NETWORKS, ethereumNetwork] as Network[]
    }
    return [...MAIN_NETWORKS, ethereumNetwork] as Network[]
  }, [ethereumNetwork, isDeveloperMode])

  return { networks }
}
