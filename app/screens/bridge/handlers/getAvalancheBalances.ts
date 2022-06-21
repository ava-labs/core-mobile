import {
  AssetType,
  AvalancheAssets,
  BitcoinConfigAsset,
  EthereumConfigAsset
} from '@avalabs/bridge-sdk'

import { AssetBalance } from 'screens/bridge/utils/types'
import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance'
import { bnToBig } from '@avalabs/utils-sdk'

/**
 * Get balances of wrapped erc20 tokens on Avalanche
 * @param assets
 * @param tokens
 */
export function getAvalancheBalances(
  assets: AvalancheAssets,
  tokens: TokenWithBalance[]
): AssetBalance[] {
  const erc20TokensByAddress = tokens.reduce<{
    [address: string]: TokenWithBalanceERC20
  }>((tokens, token) => {
    if (token.type !== TokenType.ERC20) {
      return tokens
    }
    // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
    tokens[token.address.toLowerCase()] = token
    return tokens
  }, {})

  return Object.values(assets)
    .filter(
      // assets won't include a NativeAsset (i.e. AVAX) so we're ignoring it
      (asset): asset is EthereumConfigAsset | BitcoinConfigAsset =>
        asset.assetType === AssetType.ERC20 || asset.assetType === AssetType.BTC
    )
    .map(asset => {
      const symbol = asset.symbol
      const token = erc20TokensByAddress[asset.wrappedContractAddress]
      const balance = token && bnToBig(token.balance, token.decimals)

      return { symbol, asset, balance }
    })
}
