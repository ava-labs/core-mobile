import {
  Asset,
  Blockchain,
  useGetTokenBalance as useGetTokenBalanceSDK,
} from '@avalabs/bridge-sdk';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import {
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';

/**
 * Get the balance for a single token.
 * @param blockchain
 * @param token
 * @param address
 * @param suspendRefresh pass true to NOT fetch the balance (useful for hidden items)
 */
export function useLoadTokenBalance(
  blockchain: Blockchain,
  token?: Asset,
  address?: string,
  suspendRefresh?: boolean,
) {
  const {addresses} = useWalletStateContext();
  const network = useNetworkContext()?.network;

  const provider =
    blockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network);

  const balance = useGetTokenBalanceSDK(
    blockchain,
    suspendRefresh ? undefined : token,
    provider,
    true,
    address ?? addresses.addrC,
  );

  return {balance};
}
