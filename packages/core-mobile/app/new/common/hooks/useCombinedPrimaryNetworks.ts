import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  MAIN_PRIMARY_NETWORKS,
  NETWORK_SOLANA,
  NETWORK_SOLANA_DEVNET,
  TEST_PRIMARY_NETWORKS
} from 'services/network/consts'
import { selectActiveAccount } from 'store/account'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
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
  const activeAccount = useSelector(selectActiveAccount)
  const isMissingXpAddress =
    activeAccount?.addressPVM === undefined ||
    activeAccount?.addressAVM === undefined ||
    activeAccount?.addressAVM === '' ||
    activeAccount?.addressPVM === ''
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  const networks = useMemo(() => {
    // Test networks
    if (isDeveloperMode) {
      return isSolanaSupportBlocked
        ? (TEST_PRIMARY_NETWORKS as Network[])
        : [...TEST_PRIMARY_NETWORKS, NETWORK_SOLANA_DEVNET]
    }

    // Main networks
    return isSolanaSupportBlocked
      ? (MAIN_PRIMARY_NETWORKS as Network[])
      : [...MAIN_PRIMARY_NETWORKS, NETWORK_SOLANA]
  }, [isDeveloperMode, isSolanaSupportBlocked])

  // filter out networks that are missing XP addresses
  const filteredNetworks = useMemo(() => {
    return networks.filter(network => {
      if (
        network.vmName === NetworkVMType.AVM ||
        network.vmName === NetworkVMType.PVM
      ) {
        return !isMissingXpAddress
      }
      return true
    })
  }, [networks, isMissingXpAddress])

  return { networks: filteredNetworks }
}
