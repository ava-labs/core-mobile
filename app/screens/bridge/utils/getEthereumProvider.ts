import {ActiveNetwork, MAINNET_NETWORK} from '@avalabs/wallet-react-components';
import {InfuraProvider, JsonRpcProvider} from '@ethersproject/providers';
const providers: Record<string, JsonRpcProvider> = {};

export function getEthereumProvider(network?: ActiveNetwork): JsonRpcProvider {
  const isMainnet = network?.chainId === MAINNET_NETWORK.chainId;
  const networkName = isMainnet ? 'homestead' : 'rinkeby';

  if (!providers[networkName]) {
    providers[networkName] = new InfuraProvider(
      networkName,
      process.env.INFURA_API_KEY,
    );
  }

  return providers[networkName];
}
