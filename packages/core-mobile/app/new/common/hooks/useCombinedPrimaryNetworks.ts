import { Network } from '@avalabs/core-chains-sdk'
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
import { WalletType } from 'services/wallet/types'
import { useActiveWallet } from './useActiveWallet'

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
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const wallet = useActiveWallet()

  const networks = useMemo(() => {
    const blockSolana =
      isSolanaSupportBlocked || wallet.type === WalletType.KEYSTONE

    // Test networks
    if (isDeveloperMode) {
      return blockSolana
        ? (TEST_PRIMARY_NETWORKS as Network[])
        : [...TEST_PRIMARY_NETWORKS, NETWORK_SOLANA_DEVNET]
    }

    // Main networks
    return blockSolana
      ? (MAIN_PRIMARY_NETWORKS as Network[])
      : [...MAIN_PRIMARY_NETWORKS, NETWORK_SOLANA]
  }, [isDeveloperMode, isSolanaSupportBlocked, wallet.type])

  return { networks }
}
