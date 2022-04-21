import {ActiveNetwork} from '@avalabs/wallet-react-components';
import {getEthereumProvider} from '../utils/getEthereumProvider';
import {Asset, Blockchain, fetchTokenBalances} from '@avalabs/bridge-sdk';
import Big from 'big.js';

export async function getEthereumBalance(
  asset: Asset,
  account: string,
  deprecated: boolean,
  network?: ActiveNetwork,
) {
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
