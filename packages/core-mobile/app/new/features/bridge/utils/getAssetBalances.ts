import { BridgeAsset, isErc20Asset } from '@avalabs/bridge-unified'
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'
import { AssetBalance } from 'common/utils/bridgeUtils'

/**
 * Get balances of EVM assets
 * @param assets
 * @param tokens
 */
export function getAssetBalances(
  assets: Array<BridgeAsset>,
  tokens: TokenWithBalance[]
): AssetBalance[] {
  const erc20TokensByAddress = tokens.reduce<{
    [address: string]: TokenWithBalance | undefined
  }>((tokensWithBalance, token) => {
    if (token.type !== TokenType.ERC20) {
      tokensWithBalance[token.symbol.toLowerCase()] = token
      return tokensWithBalance
    }
    // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
    tokensWithBalance[token.address.toLowerCase()] = token
    return tokensWithBalance
  }, {})

  return Object.values(assets).map(asset => {
    const symbol = asset.symbol
    const token =
      erc20TokensByAddress[
        isErc20Asset(asset)
          ? asset.address?.toLowerCase()
          : asset.symbol.toLowerCase()
      ]

    const balance = token && token.balance
    return { symbol, asset, balance, logoUri: token?.logoUri }
  })
}
