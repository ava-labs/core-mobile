import {
  TokenType as SdkTokenType,
  type AssetWithExtras
} from '@avalabs/fusion-sdk'
import type { Address as EvmAddress } from 'viem'
import type { Address as SolanaAddress } from '@solana/kit'
import { DEFAULT_TOKEN_DECIMALS } from '../consts'
import type { ApiToken } from '../types'

/**
 * Converts a v2 token-aggregator ApiToken to a Fusion SDK `AssetWithExtras`.
 *
 * Used by the MARKR service initializer's `getTargetChainAssets` callback —
 * Markr consumes the resulting list to compute swappable destinations from
 * a given source. Returns `undefined` for tokens whose chain namespace we
 * can't map (caller should filter these out).
 */
export const mapApiTokenToAsset = (
  apiToken: ApiToken
): AssetWithExtras | undefined => {
  const decimals = apiToken.decimals ?? DEFAULT_TOKEN_DECIMALS
  const { symbol, name } = apiToken

  if (apiToken.isNative) {
    return {
      type: SdkTokenType.NATIVE,
      symbol,
      name,
      decimals,
      logoUri: apiToken.logoUri ?? undefined
    }
  }

  // Address required for non-native tokens
  if (!apiToken.address) return undefined

  const isSolana =
    apiToken.contractType === 'SPL' ||
    apiToken.networkCaip2Id.startsWith('solana:')

  if (isSolana) {
    return {
      type: SdkTokenType.SPL,
      symbol,
      name,
      decimals,
      logoUri: apiToken.logoUri ?? undefined,
      address: apiToken.address as SolanaAddress
    }
  }

  return {
    type: SdkTokenType.ERC20,
    symbol,
    name,
    decimals,
    logoUri: apiToken.logoUri ?? undefined,
    address: apiToken.address as EvmAddress
  }
}
