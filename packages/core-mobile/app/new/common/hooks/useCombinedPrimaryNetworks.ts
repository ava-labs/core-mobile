import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  MAIN_PRIMARY_NETWORKS,
  TEST_PRIMARY_NETWORKS
} from 'services/network/consts'
import { selectIsDeveloperMode } from 'store/settings/advanced'

/**
 * Hook to get the combined primary networks (networks are merged together with same address)
 * based on the developer mode.
 * for example, C-Chain and EVM are merged togther, and X-Chain and P-Chain are merged together.
 * @returns {Object} An array containing the combined primary networks.
 */
export function useCombinedPrimaryNetworks(): {
  networks: Network[]
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) return TEST_PRIMARY_NETWORKS as Network[]
    return MAIN_PRIMARY_NETWORKS as Network[]
  }, [isDeveloperMode])

  return { networks }
}
