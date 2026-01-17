import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  MAIN_PRIMARY_NETWORKS,
  NETWORK_SOLANA,
  NETWORK_SOLANA_DEVNET,
  TEST_PRIMARY_NETWORKS
} from 'services/network/consts'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import { useHasXpAddresses } from './useHasXpAddresses'

/**
 * Hook to get the combined primary networks (networks are merged together with same address)
 * based on the developer mode.
 * for example, C-Chain and EVM are merged togther, and X-Chain and P-Chain are merged together.
 * @returns {Object} An array containing the combined primary networks.
 */
export function useCombinedPrimaryNetworks(): {
  networks: Network[]
} {
  const hasXpAddresses = useHasXpAddresses()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const account = useSelector(selectActiveAccount)

  const networks = useMemo(() => {
    // Test networks
    if (isDeveloperMode) {
      return isSolanaSupportBlocked ||
        account?.addressSVM === undefined ||
        account?.addressSVM.length === 0
        ? (TEST_PRIMARY_NETWORKS as Network[])
        : [...TEST_PRIMARY_NETWORKS, NETWORK_SOLANA_DEVNET]
    }

    // Main networks
    return isSolanaSupportBlocked ||
      account?.addressSVM === undefined ||
      account?.addressSVM.length === 0
      ? (MAIN_PRIMARY_NETWORKS as Network[])
      : [...MAIN_PRIMARY_NETWORKS, NETWORK_SOLANA]
  }, [account?.addressSVM, isDeveloperMode, isSolanaSupportBlocked])

  // filter out networks that are missing XP addresses
  const filteredNetworks = useMemo(() => {
    return networks.filter(network => {
      if (
        network.vmName === NetworkVMType.AVM ||
        network.vmName === NetworkVMType.PVM
      ) {
        return hasXpAddresses
      }
      return true
    })
  }, [networks, hasXpAddresses])

  return { networks: filteredNetworks }
}
