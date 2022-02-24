import {
  Asset,
  Blockchain,
  useGetTokenBalance as useGetTokenBalanceSDK,
} from '@avalabs/bridge-sdk';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';

/**
 * Get the balance for a single token.
 * @param suspendRefresh pass true to NOT fetch the balance (useful for hidden items)
 */
export function useLoadAssetBalance(
  blockchain: Blockchain,
  token?: Asset,
  address?: string,
  suspendRefresh?: boolean,
) {
  const provider =
    blockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider()
      : getEthereumProvider();

  const balance = useGetTokenBalanceSDK(
    blockchain,
    suspendRefresh ? undefined : token,
    provider,
    true,
    address,
  );

  return {balance};
}
