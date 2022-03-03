import {
  Asset,
  Assets,
  Blockchain,
  fetchTokenBalances,
} from '@avalabs/bridge-sdk';
import {
  ActiveNetwork,
  FUJI_NETWORK,
  MAINNET_NETWORK,
  network$,
} from '@avalabs/wallet-react-components';
import {
  InfuraProvider,
  JsonRpcProvider,
  StaticJsonRpcProvider,
} from '@ethersproject/providers';

import Big from 'big.js';
import {firstValueFrom} from 'rxjs';

export async function getEthereumBalance(
  asset: Asset,
  account: string,
  deprecated: boolean,
): Promise<Big> {
  const network = await firstValueFrom(network$);
  const provider = getEthereumProvider(network);
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    {[asset.symbol]: asset},
    Blockchain.ETHEREUM,
    provider,
    account,
    deprecated,
  );

  const balance: Big = ethereumBalancesBySymbol?.[asset.symbol];

  return balance;
}

const providers: Record<string, JsonRpcProvider> = {};

export async function getEthereumBalances(
  assets: Assets,
  account: string,
  deprecated: boolean,
) {
  const network = await firstValueFrom(network$);
  const provider = getEthereumProvider(network);
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    assets,
    Blockchain.ETHEREUM,
    provider,
    account,
    deprecated,
  );

  const balances: Record<string, Big> = {};

  for (const symbol in assets) {
    balances[symbol] = ethereumBalancesBySymbol?.[symbol];
  }

  return balances;
}

/**
 *
 * Providers
 * @param network
 */

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

export function getAvalancheProvider(network?: ActiveNetwork | undefined) {
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
