import {ActiveNetwork, FUJI_NETWORK} from '@avalabs/wallet-react-components';
import {JsonRpcProvider, StaticJsonRpcProvider} from '@ethersproject/providers';

const providers: Record<string, JsonRpcProvider> = {};

export function getAvalancheProvider(network?: ActiveNetwork): JsonRpcProvider {
  const chainId = network?.chainId || FUJI_NETWORK.chainId;

  if (network && !providers[chainId]) {
    const avalancheProvider = new StaticJsonRpcProvider(
      network.config.rpcUrl.c,
    );
    avalancheProvider.pollingInterval = 1000;
    providers[chainId] = avalancheProvider;
  }

  return providers[chainId];
}
