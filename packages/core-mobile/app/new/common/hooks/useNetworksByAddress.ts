import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAIN_NETWORKS, TEST_NETWORKS } from 'services/network/consts'
import { selectIsDeveloperMode } from 'store/settings/advanced'

/**
 * Hook to get the networks by address (networks are merged together with same address)
 * based on the developer mode.
 * @returns {Object} An object containing the networks.
 */
export function useNetworksByAddress(): {
  networks: Network[]
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) return TEST_NETWORKS as Network[]
    return MAIN_NETWORKS as Network[]
  }, [isDeveloperMode])

  return { networks }
}
