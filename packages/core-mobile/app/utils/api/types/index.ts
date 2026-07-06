import {
  GetV1WatchlistMarketsResponse,
  GetV1WatchlistTrendingResponse
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client/types.gen'

export type WatchlistMarketsResponse = GetV1WatchlistMarketsResponse

export type TrendingToken = GetV1WatchlistTrendingResponse[number]
