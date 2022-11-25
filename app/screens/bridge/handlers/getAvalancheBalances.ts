import {
  AssetType,
  AvalancheAssets,
  BIG_ZERO,
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
  }>((tokensWithBalance, token) => {
    if (token.type !== TokenType.ERC20) {
      return tokensWithBalance
    }
    // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
    tokensWithBalance[token.address.toLowerCase()] = token
    return tokensWithBalance
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
      const balance =
        (token && bnToBig(token.balance, token.decimals)) || BIG_ZERO
      return { symbol, asset, balance }
    })
}
