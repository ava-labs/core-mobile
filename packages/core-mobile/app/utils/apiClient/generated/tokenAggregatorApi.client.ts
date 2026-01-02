import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const includeSolana = z.union([z.string(), z.boolean()]).optional()
const TokenListResponse = z.object({
  data: z.record(
    z.object({
      tokens: z.array(
        z.object({
          internalId: z.string(),
          address: z.string(),
          name: z.string(),
          symbol: z.string(),
          isNative: z.boolean(),
          logoUri: z.string().optional(),
          caip2Id: z.string(),
          contractType: z.enum(['ERC-20', 'SPL']),
          chainId: z.number(),
          decimals: z.number(),
          color: z.string().optional()
        })
      )
    })
  )
})
const TokensResponse = z.object({
  data: z.array(
    z.object({
      internalId: z.string(),
      address: z.string(),
      name: z.string(),
      symbol: z.string(),
      isNative: z.boolean(),
      logoUri: z.string().nullable(),
      decimals: z.number().nullable()
    })
  )
})
const Platforms = z.record(z.string())
const ScanResult = z.enum(['Benign', 'Warning', 'Malicious', 'Spam'])
const Decimals = z.record(z.number().nullable())
const TokenMetadata = z.object({
  logoUri: z.string().nullable(),
  decimals: Decimals.nullable()
})
const TrendingListResponse = z.object({
  data: z.array(
    z.object({
      internalId: z.string(),
      coingeckoId: z.string().nullish(),
      platforms: Platforms.nullable(),
      isNative: z.boolean().default(false),
      name: z.string(),
      symbol: z.string(),
      scanResult: ScanResult.nullish(),
      scannedAt: z.string().nullish(),
      meta: TokenMetadata.nullish(),
      rank: z.number(),
      chain: z.string()
    })
  )
})
const Caip2IdAddressPair = z
  .object({ caip2Id: z.string(), address: z.string() })
  .passthrough()
const InternalId = z.object({ internalId: z.string() }).passthrough()
const postV1tokenlookup_Body = z
  .object({
    tokens: z.array(z.union([Caip2IdAddressPair, InternalId])).max(500)
  })
  .passthrough()
const TokenInfo = z.object({
  internalId: z.string(),
  coingeckoId: z.string().nullish(),
  platforms: Platforms.nullable(),
  isNative: z.boolean().default(false),
  name: z.string(),
  symbol: z.string(),
  scanResult: ScanResult.nullish(),
  scannedAt: z.string().nullish(),
  meta: TokenMetadata.nullish()
})
const TokenLookupResponse = z.object({ data: z.record(TokenInfo) })
const TokenLookupWithPriceInfoResponse = z.object({
  data: z.record(
    z.object({
      internalId: z.string(),
      coingeckoId: z.string().nullish(),
      platforms: Platforms.nullable(),
      isNative: z.boolean().default(false),
      name: z.string(),
      symbol: z.string(),
      scanResult: ScanResult.nullish(),
      scannedAt: z.string().nullish(),
      meta: TokenMetadata.nullish(),
      priceInfo: z
        .record(
          z.object({
            price: z.number().nullable(),
            priceChange24h: z.number().nullable(),
            priceChangePercent24h: z.number().nullable()
          })
        )
        .nullable()
    })
  )
})
const MetaData = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalRecords: z.number()
})
const WatchlistResponse = z.object({
  data: z.array(
    z.object({
      internalId: z.string(),
      coingeckoId: z.string().nullish(),
      platforms: Platforms.nullable(),
      isNative: z.boolean().default(false),
      name: z.string(),
      symbol: z.string(),
      scanResult: ScanResult.nullish(),
      scannedAt: z.string().nullish(),
      meta: TokenMetadata.nullish(),
      rank: z.number().nullish()
    })
  ),
  metadata: MetaData
})
const ByCurrencyMetaInfo = z.array(
  z.object({
    internalId: z.string(),
    coingeckoId: z.string().nullish(),
    platforms: Platforms.nullable(),
    isNative: z.boolean().default(false),
    name: z.string(),
    symbol: z.string(),
    scanResult: ScanResult.nullish(),
    scannedAt: z.string().nullish(),
    meta: TokenMetadata.nullish(),
    id: z.string().nullable(),
    image: z.string().nullable(),
    current_price: z.number().nullish(),
    market_cap: z.number().nullish(),
    market_cap_rank: z.number().nullish(),
    fully_diluted_valuation: z.number().nullish(),
    total_volume: z.number().nullish(),
    high_24h: z.number().nullish(),
    low_24h: z.number().nullish(),
    price_change_24h: z.number().nullish(),
    price_change_percentage_24h: z.number().nullish(),
    market_cap_change_24h: z.number().nullish(),
    market_cap_change_percentage_24h: z.number().nullish(),
    circulating_supply: z.number().nullish(),
    total_supply: z.number().nullish(),
    max_supply: z.number().nullish(),
    ath: z.number().nullish(),
    ath_change_percentage: z.number().nullish(),
    ath_date: z.string().nullish(),
    atl: z.number().nullish(),
    atl_change_percentage: z.number().nullish(),
    atl_date: z.string().nullish(),
    roi: z
      .object({
        times: z.number(),
        currency: z.string(),
        percentage: z.number()
      })
      .nullish(),
    last_updated: z.string().nullish(),
    sparkline_in_7d: z
      .object({ price: z.array(z.number()).nullable() })
      .nullish()
  })
)
const CoinPriceResponse = z.record(
  z.record(
    z
      .object({
        price: z.number().nullable(),
        change24: z.number().nullable(),
        vol24: z.number().nullable(),
        marketCap: z.number().nullable()
      })
      .partial()
  )
)
const BirdeyeTrendingResponse = z.array(
  z.object({
    internalId: z.string(),
    coingeckoId: z.string().nullish(),
    platforms: Platforms.nullable(),
    isNative: z.boolean().default(false),
    name: z.string(),
    symbol: z.string(),
    scanResult: ScanResult.nullish(),
    scannedAt: z.string().nullish(),
    meta: TokenMetadata.nullish(),
    decimals: z.number(),
    liquidity: z.number(),
    address: z.string(),
    logoURI: z.string().nullish(),
    volume24hUSD: z.number().nullish(),
    volume24hChangePercent: z.number().nullish(),
    fdv: z.number().nullish(),
    marketcap: z.number().nullish(),
    rank: z.number().nullish(),
    price: z.number().nullish(),
    price24hChangePercent: z.number().nullish(),
    lastUpdated: z.string(),
    website: z.string().nullish(),
    twitter: z.string().nullish(),
    discord: z.string().nullish(),
    medium: z.string().nullish(),
    verified: z.boolean().nullish(),
    sparkline: z
      .array(z.object({ unixTime: z.number(), value: z.number() }))
      .nullable()
  })
)

export const schemas = {
  includeSolana,
  TokenListResponse,
  TokensResponse,
  Platforms,
  ScanResult,
  Decimals,
  TokenMetadata,
  TrendingListResponse,
  Caip2IdAddressPair,
  InternalId,
  postV1tokenlookup_Body,
  TokenInfo,
  TokenLookupResponse,
  TokenLookupWithPriceInfoResponse,
  MetaData,
  WatchlistResponse,
  ByCurrencyMetaInfo,
  CoinPriceResponse,
  BirdeyeTrendingResponse
}

const endpoints = makeApi([
  {
    method: 'post',
    path: '/v1/token/lookup',
    alias: 'postV1tokenlookup',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: postV1tokenlookup_Body
      }
    ],
    response: TokenLookupResponse
  },
  {
    method: 'post',
    path: '/v1/token/lookup-with-price',
    alias: 'postV1tokenlookupWithPrice',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: postV1tokenlookup_Body
      }
    ],
    response: TokenLookupWithPriceInfoResponse
  },
  {
    method: 'get',
    path: '/v1/tokenlist',
    alias: 'getV1tokenlist',
    requestFormat: 'json',
    parameters: [
      {
        name: 'includeSolana',
        type: 'Query',
        schema: includeSolana
      }
    ],
    response: TokenListResponse
  },
  {
    method: 'get',
    path: '/v1/tokens',
    alias: 'getV1tokens',
    requestFormat: 'json',
    parameters: [
      {
        name: 'caip2Id',
        type: 'Query',
        schema: z.string()
      }
    ],
    response: TokensResponse
  },
  {
    method: 'get',
    path: '/v1/trending-list',
    alias: 'getV1trendingList',
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: TrendingListResponse
  },
  {
    method: 'get',
    path: '/v1/watchlist/',
    alias: 'getV1watchlist',
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number()
      },
      {
        name: 'pageSize',
        type: 'Query',
        schema: z.number()
      },
      {
        name: 'excludePlatforms',
        type: 'Query',
        schema: z.array(z.string()).optional()
      }
    ],
    response: WatchlistResponse
  },
  {
    method: 'get',
    path: '/v1/watchlist/markets',
    alias: 'getV1watchlistmarkets',
    requestFormat: 'json',
    parameters: [
      {
        name: 'currency',
        type: 'Query',
        schema: z.string()
      },
      {
        name: 'topMarkets',
        type: 'Query',
        schema: z.boolean().optional()
      }
    ],
    response: ByCurrencyMetaInfo
  },
  {
    method: 'get',
    path: '/v1/watchlist/price',
    alias: 'getV1watchlistprice',
    requestFormat: 'json',
    response: CoinPriceResponse
  },
  {
    method: 'get',
    path: '/v1/watchlist/tokens',
    alias: 'getV1watchlisttokens',
    requestFormat: 'json',
    parameters: [
      {
        name: 'currency',
        type: 'Query',
        schema: z.string()
      },
      {
        name: 'caip2Id',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'tokens',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: ByCurrencyMetaInfo
  },
  {
    method: 'get',
    path: '/v1/watchlist/trending',
    alias: 'getV1watchlisttrending',
    requestFormat: 'json',
    parameters: [
      {
        name: 'network',
        type: 'Query',
        schema: z.string().optional().default('avalanche')
      }
    ],
    response: BirdeyeTrendingResponse
  }
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
