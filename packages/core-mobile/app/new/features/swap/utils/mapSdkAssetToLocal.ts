import { TokenType as FusionTokenType } from '@avalabs/fusion-sdk'
import type { BridgeableUiAsset } from '@avalabs/fusion-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import { TokenUnit } from '@avalabs/core-utils-sdk'

const getLocalIdFromSdkAsset = (asset: BridgeableUiAsset): string => {
  if (asset.type === FusionTokenType.NATIVE) {
    return `NATIVE-${asset.symbol.toLowerCase()}`
  }
  return asset.address.toLowerCase()
}

const getTokenTypeFromSdkAsset = (
  asset: BridgeableUiAsset
): TokenType.NATIVE | TokenType.ERC20 | TokenType.SPL => {
  if (asset.type === FusionTokenType.NATIVE) return TokenType.NATIVE
  if (asset.type === FusionTokenType.SPL) return TokenType.SPL
  return TokenType.ERC20
}

/**
 * Converts a Fusion SDK BridgeableUiAsset to a LocalTokenWithBalance for display.
 * Optionally merges portfolio balance data so tokens the user holds show their balance.
 *
 * Handles both ERC20 and native assets — v2 API returns native tokens so no
 * manual injection is needed; this function maps them correctly from SDK types.
 */
export const mapSdkAssetToLocal = (
  asset: BridgeableUiAsset,
  networkChainId: number,
  balanceData?: LocalTokenWithBalance
): LocalTokenWithBalance => {
  const localId = getLocalIdFromSdkAsset(asset)
  const { decimals, symbol } = asset
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
    reputation: null
  } as LocalTokenWithBalance
}
