import {
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import { useMemo } from 'react'
import {
  getAvalancheEvmProvider,
  getBitcoinProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { useNetworks } from './useNetworks'

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
    () => getAvalancheEvmProvider(networks, activeNetwork.isTestnet),
    [networks, activeNetwork]
  )
}
