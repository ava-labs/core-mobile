import { Network } from '@avalabs/core-chains-sdk'
import { createStore } from 'common/store/createStore'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'

export const useReceiveSelectedNetworkStore = createStore<Network>(
  AVALANCHE_MAINNET_NETWORK
)

export const useReceiveSelectedNetwork = (): [
  Network,
  (n: Network) => void
] => {
  const value = useReceiveSelectedNetworkStore(s => s.value)
  const setValue = useReceiveSelectedNetworkStore(s => s.setValue)
  return [value, setValue]
}
