import { TokenType as FusionTokenType } from '@avalabs/fusion-sdk'
import type { Asset } from '@avalabs/fusion-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { xpChainToken } from 'utils/units/knownTokens'
import { buildAvailableFields } from './buildAvailableFields'

const getLocalIdFromSdkAsset = (asset: Asset): string => {
  if (asset.type === FusionTokenType.NATIVE) {
    // Lowercase the symbol so the resulting id matches the lowercase
    // convention used in `consts/tokenIds` (e.g. `NATIVE-avax`). Otherwise
    // watchlist lookups via `getMarketTokenById` miss and the destination
    // token can't fall back to a market price.
    return `NATIVE-${asset.symbol.toLowerCase()}`
  }
  return asset.address.toLowerCase()
}

const getTokenTypeFromSdkAsset = (
  asset: Asset
): TokenType.NATIVE | TokenType.ERC20 | TokenType.SPL => {
  if (asset.type === FusionTokenType.NATIVE) return TokenType.NATIVE
  if (asset.type === FusionTokenType.SPL) return TokenType.SPL
  return TokenType.ERC20
}

/**
 * Converts a Fusion SDK Asset to a LocalTokenWithBalance for display.
 * Optionally merges portfolio balance data so tokens the user holds show their balance.
 *
 * Handles ERC20, SPL, and native assets — v2 API returns native tokens so no
 * manual injection is needed; this function maps them correctly from SDK types.
 */
export const mapSdkAssetToLocal = (
  asset: Asset,
  networkChainId: number,
  balanceData?: LocalTokenWithBalance
): LocalTokenWithBalance & { decimals: number; address?: string } => {
  const localId = getLocalIdFromSdkAsset(asset)
  const { symbol } = asset
  // CCT's `getBridgeableAssets` uses the source chain (not the target) to
  // pick the native asset metadata, so a P→X query returns the C-Chain
  // asset with decimals=18 even though X-Chain is 9-decimal nAVAX. Override
  // here so downstream math (display, amount input) uses the chain's actual
  // on-chain precision.
  const decimals =
    asset.type === FusionTokenType.NATIVE &&
    (isPChain(networkChainId) || isXChain(networkChainId))
      ? xpChainToken.maxDecimals
      : asset.decimals
  const balance = balanceData?.balance ?? 0n
  const balanceDisplayValue = new TokenUnit(
    balance,
    decimals,
    symbol
  ).toDisplay()
  const address =
    asset.type !== FusionTokenType.NATIVE ? asset.address : undefined

  return {
    type: getTokenTypeFromSdkAsset(asset),
    symbol,
    name: asset.name,
    description: asset.name,
    decimals,
    logoUri: asset.logoUri ?? undefined,
    address,
    localId,
    internalId: localId,
    networkChainId,
    isDataAccurate: true,
    balance,
    balanceDisplayValue,
    balanceInCurrency: balanceData?.balanceInCurrency ?? 0,
    priceInCurrency: balanceData?.priceInCurrency ?? 0,
    // Carry P/X-chain swappable-balance fields so the rebuilt token keeps them
    // (CP-14788). No-op for other token types.
    ...buildAvailableFields(balanceData, decimals, symbol),
    reputation: null
  } as LocalTokenWithBalance & { decimals: number; address?: string }
}
