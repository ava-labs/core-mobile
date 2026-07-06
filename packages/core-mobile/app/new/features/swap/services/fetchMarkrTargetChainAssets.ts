import type { MarkrServiceInitializer } from '@avalabs/fusion-sdk'
import { getV2Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { mapApiTokenToAsset } from '../utils/mapApiTokenToAsset'

/**
 * Fetches the target-chain token list from the v2 token aggregator API,
 * mapped to the Fusion SDK's `AssetWithExtras` shape. Passed to the MARKR
 * service initializer as its `getTargetChainAssets` callback — MARKR uses
 * this list to compute swappable destinations from a given source asset.
 */
export const fetchMarkrTargetChainAssets: MarkrServiceInitializer['getTargetChainAssets'] =
  async ({ targetChainId, page, limit, search }) => {
    const response = await getV2Tokens({
      client: tokenAggregatorApi,
      query: {
        caip2Id: targetChainId,
        page,
        limit,
        ...(search?.type === 'address' ? { address: search.value } : {}),
        ...(search?.type === 'keyword' ? { keyword: search.value } : {})
      }
    })
    const apiTokens = response.data?.data?.tokens ?? []
    const meta = response.data?.metadata
    const assets = apiTokens
      .map(mapApiTokenToAsset)
      .filter(
        (asset): asset is NonNullable<typeof asset> => asset !== undefined
      )
    const currentPage = meta?.currentPage ?? page
    const totalPages = meta?.totalPages ?? currentPage
    const hasMore = currentPage < totalPages
    return {
      assets,
      meta: {
        currentPage,
        hasMore,
        nextPage: hasMore ? currentPage + 1 : undefined
      }
    }
  }
