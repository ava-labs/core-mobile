import type {
  Asset,
  Caip2ChainId,
  Erc20Asset,
  NativeAsset
} from '@avalabs/fusion-sdk'
import { TokenType } from '@avalabs/fusion-sdk'
import { getV2Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import Logger from 'utils/Logger'

const PAGE_LIMIT = 1000

/**
 * Fetches assets available on the target chain for the Fusion SDK's MARKR service.
 *
 * Uses the v2 token API with limit: 1000 (max per schema) to get the full list in one page.
 * v2 includes native tokens, so no manual native token injection is needed.
 *
 * This function is passed as the `getTargetChainAssets` callback to MarkrServiceInitializer.
 */
export const fetchTargetChainAssets = async (
  targetChainId: Caip2ChainId
): Promise<readonly Asset[]> => {
  try {
    const response = await getV2Tokens({
      client: tokenAggregatorApi,
      query: { caip2Id: targetChainId, limit: PAGE_LIMIT, page: 1 }
    })

    const tokens = response.data?.tokens ?? []

    return tokens.map((token): Asset => {
      if (token.isNative) {
        const nativeAsset: NativeAsset = {
          type: TokenType.NATIVE,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoUri: token.logoUri ?? undefined
        }
        return nativeAsset
      }
      const erc20Asset: Erc20Asset = {
        type: TokenType.ERC20,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address as `0x${string}`,
        logoUri: token.logoUri ?? undefined
      }
      return erc20Asset
    })
  } catch (error) {
    Logger.error('[fetchTargetChainAssets] failed to fetch assets', error)
    return []
  }
}
