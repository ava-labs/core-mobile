import { Asset, BIG_ZERO, isBtcAsset, isNativeAsset } from '@avalabs/bridge-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { AssetBalance } from 'screens/bridge/utils/types'
import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance'
import { bnToBig } from '@avalabs/utils-sdk'
import { isUnifiedBridgeAsset } from '../utils/bridgeUtils'

/**
 * Get balances of EVM assets
 * @param assets
 * @param tokens
 */
export function getEVMAssetBalances(
  assets: Array<Asset | BridgeAsset>,
  tokens: TokenWithBalance[]
): AssetBalance[] {
  const erc20TokensByAddress = tokens.reduce<{
    [address: string]: TokenWithBalanceERC20 | TokenWithBalance | undefined
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
    const token = isUnifiedBridgeAsset(asset)
      ? erc20TokensByAddress[asset.address?.toLowerCase() ?? asset.symbol]
      : isNativeAsset(asset)
      ? erc20TokensByAddress[asset.symbol.toLowerCase()]
      : isBtcAsset(asset)
      ? erc20TokensByAddress[asset.wrappedContractAddress.toLowerCase()]
      : erc20TokensByAddress[asset.wrappedContractAddress?.toLowerCase()] ||
        erc20TokensByAddress[asset.nativeContractAddress?.toLowerCase()]

    const balance =
      (token && bnToBig(token.balance, token.decimals)) || BIG_ZERO
    return { symbol, asset, balance }
  })
}
