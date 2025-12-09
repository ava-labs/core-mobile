import { Client } from 'openapi-fetch'
import { paths as glacierPaths } from '../generated/glacier/schema'
import { paths as tokenPaths } from '../generated/tokenAggregator/schema'

export type WatchlistMarketsResponse =
  tokenPaths['/v1/watchlist/markets']['get']['responses'][200]['content']['application/json']
export type SimplePriceResponse =
  tokenPaths['/v1/watchlist/price']['get']['responses'][200]['content']['application/json']
export type WatchlistMarket = WatchlistMarketsResponse[number]
export type TrendingToken =
  tokenPaths['/v1/watchlist/trending']['get']['responses'][200]['content']['application/json'][number]

/**
 * OpenAPI client interface for aggregared tokens endpoints
 * This allows any openapi-fetch client with the correct schema to be injected
 */
export type AggregatedApiHttpClient = Client<tokenPaths>

/**
 * OpenAPI client interface for glacier endpoints
 * This allows any openapi-fetch client with the correct schema to be injected
 */
export type GlacierApiHttpClient = Client<glacierPaths>
