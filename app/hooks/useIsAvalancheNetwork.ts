import { ChainId } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export const useIsAvalancheNetwork = () => {
  const network = useSelector(selectActiveNetwork)

  return [ChainId.AVALANCHE_TESTNET_ID, ChainId.AVALANCHE_MAINNET_ID].includes(
    network.chainId
  )
}
