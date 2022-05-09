import { isMainnetNetwork } from '@avalabs/avalanche-wallet-sdk'
import { useNetworkContext } from '@avalabs/wallet-react-components'

export const useIsMainnet = () => {
  const network = useNetworkContext()?.network
  return network ? isMainnetNetwork(network.config) : true
}
