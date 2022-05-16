import { useSelector } from 'react-redux'
import { selectActiveNetwork, MAINNET_NETWORK } from 'store/network'

export const useIsMainnet = () => {
  const network = useSelector(selectActiveNetwork)
  return network.chainId === MAINNET_NETWORK.chainId
}
