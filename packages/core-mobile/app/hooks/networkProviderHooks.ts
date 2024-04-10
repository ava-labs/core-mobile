import { BitcoinProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { useMemo } from 'react'
import {
  getAvalancheProvider,
  getBitcoinProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { useNetworks } from './useNetworks'

export function useEthereumProvider(): JsonRpcBatchInternal | undefined {
  const { selectActiveNetwork, selectNetworks } = useNetworks()
  const networks = selectNetworks()
  const network = selectActiveNetwork()

  return useMemo(
    () => getEthereumProvider(networks, network.isTestnet),
    [networks, network]
  )
}

export function useBitcoinProvider(): BitcoinProvider {
  const { selectActiveNetwork } = useNetworks()
  const network = selectActiveNetwork()

  return useMemo(() => getBitcoinProvider(network.isTestnet), [network])
}

export function useAvalancheProvider(): JsonRpcBatchInternal | undefined {
  const { selectActiveNetwork, selectNetworks } = useNetworks()
  const networks = selectNetworks()
  const network = selectActiveNetwork()

  return useMemo(
    () => getAvalancheProvider(networks, network.isTestnet),
    [networks, network]
  )
}
