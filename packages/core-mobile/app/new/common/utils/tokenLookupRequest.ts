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
     * This chunks request never landed so we know nothing about its tokens
     * this is different than when the request succeeds but we don't have that token in the catalog on the backend
     * Callers must reject these rather than resolve empty so that it can retry, otherwise it will React Query will
     * cache this as empty until the next staleTime or garbage collection when a simple retry may have re populated it
     */
    failedTokens.push(...(chunks[index] ?? []))
  })

  return { data, failedTokens }
}
