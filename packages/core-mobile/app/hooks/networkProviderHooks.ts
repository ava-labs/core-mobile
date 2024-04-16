import { BitcoinProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { useMemo } from 'react'
import {
  getAvalancheProvider,
  getBitcoinProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { useNetworks } from './networks/useNetworks'

export function useEthereumProvider(): JsonRpcBatchInternal | undefined {
  const { activeNetwork, networks } = useNetworks()

  return useMemo(
    () => getEthereumProvider(networks, activeNetwork.isTestnet),
    [networks, activeNetwork]
  )
}

export function useBitcoinProvider(): BitcoinProvider {
  const { activeNetwork } = useNetworks()

  return useMemo(
    () => getBitcoinProvider(activeNetwork.isTestnet),
    [activeNetwork]
  )
}

export function useAvalancheProvider(): JsonRpcBatchInternal | undefined {
  const { activeNetwork, networks } = useNetworks()

  return useMemo(
    () => getAvalancheProvider(networks, activeNetwork.isTestnet),
    [networks, activeNetwork]
  )
}
