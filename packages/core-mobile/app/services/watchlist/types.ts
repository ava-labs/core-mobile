import { tokenAggregatorApi } from 'utils/apiClient/tokenAggregator'

export type WatchlistMarketsResponse = Awaited<
  ReturnType<typeof tokenAggregatorApi.getV1watchlistmarkets>
>

export type WatchlistMarket = WatchlistMarketsResponse[number]
