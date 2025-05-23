import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  MAIN_MERGED_NETWORKS,
  TEST_MERGED_NETWORKS
} from 'services/network/consts'
import { selectIsDeveloperMode } from 'store/settings/advanced'

/**
 * Hook to get the merged networks (networks are merged together with same address)
 * based on the developer mode.
 * @returns {Object} An object containing the networks.
 */
export function useMergedNetworks(): {
  networks: Network[]
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) return TEST_MERGED_NETWORKS as Network[]
    return MAIN_MERGED_NETWORKS as Network[]
  }, [isDeveloperMode])

  return { networks }
}
