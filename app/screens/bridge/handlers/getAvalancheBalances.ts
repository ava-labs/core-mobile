import {
  AssetType,
  AvalancheAssets,
  BitcoinConfigAsset,
  EthereumConfigAsset,
} from '@avalabs/bridge-sdk';
import {ERC20WithBalance} from '@avalabs/wallet-react-components';
import {AssetBalance} from 'screens/bridge/AssetBalance';
import {bnToBig} from '@avalabs/avalanche-wallet-sdk';

/**
 * Get balances of wrapped erc20 tokens on Avalanche
 * @param assets
 * @param erc20Tokens
 */
export function getAvalancheBalances(
  assets: AvalancheAssets,
  erc20Tokens: ERC20WithBalance[],
): AssetBalance[] {
  const erc20TokensByAddress = erc20Tokens.reduce<{
    [address: string]: ERC20WithBalance;
  }>((tokens, token) => {
    // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
    tokens[token.address.toLowerCase()] = token;
    return tokens;
  }, {});

  return Object.values(assets)
    .filter(
      // assets won't include a NativeAsset (i.e. AVAX) so we're ignoring it
      (asset): asset is EthereumConfigAsset | BitcoinConfigAsset =>
        asset.assetType === AssetType.ERC20 ||
        asset.assetType === AssetType.BTC,
    )
    .map(asset => {
      const symbol = asset.symbol;
      const token = erc20TokensByAddress[asset.wrappedContractAddress];
      const balance = token && bnToBig(token.balance, token.denomination);

      return {symbol, asset, balance};
    });
}
