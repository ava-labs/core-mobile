import { tokenAggregatorApi } from 'utils/network/tokenAggregator'

export type WatchlistMarketsResponse = Awaited<
  ReturnType<typeof tokenAggregatorApi.getV1watchlistmarkets>
>

export type WatchlistMarket = WatchlistMarketsResponse[number]
