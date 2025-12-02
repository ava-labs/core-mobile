import { paths as tokenPaths } from "../generated/tokenAggregator/schema"

export type WatchlistMarketsResponse =
  tokenPaths['/v1/watchlist/markets']['get']['responses'][200]['content']['application/json']
export type SimplePriceResponse =
  tokenPaths['/v1/watchlist/price']['get']['responses'][200]['content']['application/json']
export type WatchlistMarket = WatchlistMarketsResponse[number]
export type TrendingToken =
  tokenPaths['/v1/watchlist/trending']['get']['responses'][200]['content']['application/json'][number]