import { z } from 'zod'
import { schemas } from 'utils/apiClient/generated/tokenAggregatorApi.client'

export type WatchlistMarketsResponse = z.infer<
  typeof schemas.ByCurrencyMetaInfo
>
export type WatchlistMarket = WatchlistMarketsResponse[number]
