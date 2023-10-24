import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  getAvalancheProvider,
  getBitcoinProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { selectActiveNetwork, selectNetworks } from 'store/network'

export function useEthereumProvider() {
  const networks = useSelector(selectNetworks)
  const network = useSelector(selectActiveNetwork)

  return useMemo(
    () => getEthereumProvider(networks, network.isTestnet),
    [networks, network]
  )
}

export function useBitcoinProvider() {
  const network = useSelector(selectActiveNetwork)

  return useMemo(() => getBitcoinProvider(network.isTestnet), [network])
}

export function useAvalancheProvider() {
  const networks = useSelector(selectNetworks)
  const network = useSelector(selectActiveNetwork)

  return useMemo(
    () => getAvalancheProvider(networks, network.isTestnet),
    [networks, network]
  )
}
