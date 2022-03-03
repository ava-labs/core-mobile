import {
  Assets,
  AssetType,
  Blockchain,
  ERC20Asset,
  useAssets,
  useBridgeSDK,
} from '@avalabs/bridge-sdk';
import {
  ERC20WithBalance,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {useEffect, useMemo, useState} from 'react';
import {AssetBalance} from 'screens/bridge/AssetBalance';
import {getEthereumBalances} from 'screens/bridge/getEthereumBalance';
import {Big, bnToBig} from '@avalabs/avalanche-wallet-sdk';

/**
 * Get a list of bridge supported assets with the balances of the current blockchain.
 * The list is sorted by balance.
 */
export function useAssetBalances(): {
  assetsWithBalances: AssetBalance[];
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [ethBalances, setEthBalances] = useState<AssetBalance[]>([]);
  const {currentBlockchain} = useBridgeSDK();
  const assets = useAssets(currentBlockchain);
  const {addresses, erc20Tokens} = useWalletStateContext();

  // TODO update this when adding support for /convert
  const showDeprecated = false;

  const avalancheBalances = useMemo(() => {
    if (currentBlockchain !== Blockchain.AVALANCHE) {
      return [];
    }
    return getAvalancheBalances(assets, erc20Tokens);
  }, [assets, currentBlockchain, erc20Tokens]);

  // fetch balances from Ethereum
  useEffect(() => {
    if (currentBlockchain !== Blockchain.ETHEREUM) {
      return;
    }
    setLoading(true);

    (async function getBalances() {
      const balances = await getEthBalance(
        assets,
        addresses.addrC,
        showDeprecated,
      );

      setLoading(false);
      setEthBalances(balances);
    })();
  }, [addresses.addrC, assets, currentBlockchain, showDeprecated]);

  const assetsWithBalances = (
    currentBlockchain === Blockchain.AVALANCHE ? avalancheBalances : ethBalances
  ).sort((asset1, asset2) => asset2.balance?.cmp(asset1.balance || 0) || 0);

  return {assetsWithBalances, loading};
}

function getAvalancheBalances(
  assets: Assets,
  erc20Tokens: ERC20WithBalance[],
): AssetBalance[] {
  const erc20TokensByAddress = erc20Tokens.reduce<{
    [address: string]: ERC20WithBalance;
  }>((tokens, token) => {
    tokens[token.address] = token;
    return tokens;
  }, {});

  return Object.values(assets)
    .filter(
      // assets won't include a NativeAsset (i.e. AVAX) so we're ignoring it
      (asset): asset is ERC20Asset => asset.assetType === AssetType.ERC20,
    )
    .map(asset => {
      const symbol = asset.symbol;
      const token = erc20TokensByAddress[asset.wrappedContractAddress];
      const balance = token && bnToBig(token.balance, token.denomination);

      return {symbol, asset, balance};
    });
}

async function getEthBalance(
  assets: Assets,
  account: string,
  deprecated: boolean,
): Promise<AssetBalance[]> {
  const ethereumBalancesBySymbol = await getEthereumBalances(
    assets,
    account,
    deprecated,
  );

  return Object.entries(assets).map(([symbol, asset]) => {
    const balanceStr = ethereumBalancesBySymbol?.[symbol];
    const balance = balanceStr ? new Big(balanceStr) : undefined;

    return {symbol, asset, balance};
  });
}
