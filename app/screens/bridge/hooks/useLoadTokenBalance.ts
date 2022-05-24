import {
  Asset,
  Blockchain,
  useGetTokenBalanceEVM as useGetTokenBalanceSDK
} from '@avalabs/bridge-sdk'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import { useWalletStateContext } from '@avalabs/wallet-react-components'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

/**
 * Get the balance for a single token.
 * @param blockchain
 * @param token
 * @param address
 * @param suspendRefresh pass true to NOT fetch the balance (useful for hidden items)
 */
export function useLoadTokenBalance(
  blockchain: Blockchain.AVALANCHE | Blockchain.ETHEREUM,
  token?: Asset,
  address?: string,
  suspendRefresh?: boolean
) {
  // @ts-ignore addresses exist but why it complains needs investigation
  const { addresses } = useWalletStateContext()
  const network = useSelector(selectActiveNetwork)

  const provider =
    blockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network)

  const balance = useGetTokenBalanceSDK(
    blockchain,
    suspendRefresh ? undefined : token,
    provider,
    true,
    address ?? addresses.addrC
  )

  return { balance }
}
