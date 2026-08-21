import {
  postV1TokenLookup,
  type Caip2IdAddressPair,
  type InternalId,
  type TokenInfo
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'

import { chunkArray } from 'common/utils/chunkArray'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'

export type LookupToken = Caip2IdAddressPair | InternalId

export type LookupChunkResult = { [key: string]: TokenInfo }

export type TokenLookupResult = {
  data: LookupChunkResult
  failedTokens: LookupToken[]
}

export const TOKEN_LOOKUP_CHUNK_SIZE = 500

export const lookupChunk = async (
  tokens: LookupToken[]
): Promise<LookupChunkResult> => {
  const response = await postV1TokenLookup({
    client: tokenAggregatorApi,
    body: { tokens }
  })

  /**
   * `tokenAggregatorApi` is created with `throwOnError: true`, so a 500 or a
   * surviving 401 already threw before we got here and `error` is undefined.
   * Guard anyway: the generated signature still models `error` (its
   * `ThrowOnError` generic defaults to `false`), so nothing but that one client
   * flag stands between us and returning `{}` for a failed request -- which
   * would cache "these tokens do not exist" instead of retrying.
   */
  if (response.error !== undefined) {
    throw new Error(
      `Token lookup request failed: ${JSON.stringify(response.error)}`
    )
  }

  return response.data?.data ?? {}
}

export const lookupTokens = async (
  tokens: LookupToken[]
): Promise<TokenLookupResult> => {
  if (tokens.length === 0) {
    return { data: {}, failedTokens: [] }
  }

  const chunks = chunkArray(tokens, TOKEN_LOOKUP_CHUNK_SIZE)
  const settled = await Promise.allSettled(chunks.map(lookupChunk))

  const data: LookupChunkResult = {}
  const failedTokens: LookupToken[] = []

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      Object.assign(data, result.value)
      return
    }

    /**
     * This chunk's request never landed, so we know nothing about its tokens.
     * That is different from a request that succeeded without carrying a
     * token, which tells us the backend catalog genuinely has no entry for it.
     *
     * Callers must reject these rather than resolve them empty. Resolving
     * empty would have React Query cache "this token does not exist" until the
     * next staleTime or garbage collection, skipping the retry that would have
     * repopulated it.
     */
    failedTokens.push(...(chunks[index] ?? []))
  })

  return { data, failedTokens }
}
