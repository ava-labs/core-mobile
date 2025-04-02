import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import {
  array,
  boolean,
  date,
  number,
  object,
  record,
  string,
  tuple,
  z
} from 'zod'

export type SparklineData = number[]

const RangesSchema = object({
  minDate: number(),
  maxDate: number(),
  minPrice: number(),
  maxPrice: number(),
  diffValue: number(),
  percentChange: number()
})

export type Ranges = z.infer<typeof RangesSchema>

export const ChartDataSchema = object({
  ranges: RangesSchema,
  dataPoints: object({
    date: string()
      .or(date())
      .transform((arg: string | Date) => new Date(arg)),
    value: number()
  }).array()
})

export type ChartData = z.infer<typeof ChartDataSchema>

export type PriceWithMarketData = {
  price: number
  change24: number
  marketCap: number
  vol24: number
}

export type GetMarketsParams = {
  currency?: VsCurrencyType
  sparkline?: boolean
  coinIds?: string[]
  page?: number
  perPage?: number
}

const SimplePriceInCurrency = object({
  price: number().optional().nullable(),
  change24: number().optional().nullable(),
  marketCap: number().optional().nullable(),
  vol24: number().optional().nullable()
})

const SimplePriceInCurrencyResponseSchema = record(SimplePriceInCurrency)

export const SimplePriceResponseSchema = record(
  SimplePriceInCurrencyResponseSchema
)

export type SimplePriceInCurrencyResponse = z.infer<
  typeof SimplePriceInCurrencyResponseSchema
>
export type SimplePriceResponse = z.infer<typeof SimplePriceResponseSchema>

export const CoinMarketSchema = object({
  id: string(),
  symbol: string(),
  name: string(),
  price: number().optional().nullable(),
  image: string().optional(),
  sparkline_in_7d: object({
    price: array(number())
  })
    .nullable()
    .optional(),
  price_change_24h: number().optional().nullable(),
  price_change_percentage_24h: number().optional().nullable(),
  price_change_percentage_1h_in_currency: number().optional().nullable(),
  price_change_percentage_24h_in_currency: number().optional().nullable(),
  price_change_percentage_7d_in_currency: number().optional().nullable(),
  market_cap: number().nullable().optional(),
  total_volume: number().nullable().optional(),
  circulating_supply: number().nullable().optional(),
  current_price: number().optional().nullable(),
  last_updated: string().optional().nullable()
})

export type CoinMarket = z.infer<typeof CoinMarketSchema>

export const TrendingTokenSchema = z.object({
  address: z.string(),
  decimals: z.number(),
  liquidity: z.number().optional().nullable(),
  logoURI: z.string().optional().nullable(),
  name: z.string(),
  symbol: z.string(),
  volume24hUSD: z.number().optional().nullable(),
  volume24hChangePercent: z.number().optional().nullable(),
  fdv: z.number().optional().nullable(),
  marketcap: z.number().optional().nullable(),
  rank: z.number(),
  price: z.number(),
  price24hChangePercent: z.number().optional().nullable(),
  coingecko_id: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  medium: z.string().optional().nullable(),
  verified: z.boolean().optional().nullable(),
  sparkline: z
    .array(
      z.object({
        unixTime: z.number(),
        value: z.number()
      })
    )
    .optional()
})

export type TrendingToken = z.infer<typeof TrendingTokenSchema>

export type Error = {
  status: {
    error_code: number
    error_message: string
  }
}

const MarketTuple = tuple([number(), number()])

export const ContractMarketChartResponseSchema = object({
  prices: MarketTuple.array(),
  marketCaps: MarketTuple.array().nullable().optional(),
  totalVolumes: MarketTuple.array().nullable().optional()
})

export type ContractMarketChartResponse = z.infer<
  typeof ContractMarketChartResponseSchema
>

export const CoinsSearchResponseSchema = object({
  coins: object({
    id: string(),
    name: string(),
    api_symbol: string().nullable().optional(),
    symbol: string(),
    market_cap_rank: number().nullable().optional(),
    thumb: string().nullable().optional(),
    larg: string().nullable().optional()
  }).array()
})

export type CoinsSearchResponse = z.infer<typeof CoinsSearchResponseSchema>

export const CoinsContractInfoResponseSchema = object({
  id: string(),
  symbol: string(),
  name: string(),
  asset_platform_id: string().nullable().optional(),
  platforms: record(string(), string().nullable()).nullable().optional(),
  links: object({
    homepage: string().array().nullable().optional(),
    blockchain_site: string().array().nullable().optional(),
    official_forum_url: string().array().nullable().optional(),
    chat_url: string().array().nullable().optional(),
    announcement_url: string().array().nullable().optional(),
    twitter_screen_name: string().nullable().optional(),
    facebook_username: string().nullable().optional(),
    bitcointalk_thread_identifier: string().or(number()).nullable().optional(),
    telegram_channel_identifier: string().nullable().optional(),
    subreddit_url: string().nullable().optional(),
    repos_url: record(string(), string().array().nullable())
      .nullable()
      .optional()
  })
    .nullable()
    .optional(),
  image: object({
    thumb: string().nullable().optional(),
    small: string().nullable().optional(),
    large: string().nullable().optional()
  })
    .nullable()
    .optional(),
  market_data: object({
    current_price: record(string(), number().nullable()).optional().nullable(),
    circulating_supply: number().nullable().optional(),
    ath: record(string(), number()).nullable().optional(),
    ath_change_percentage: record(string(), number().nullable())
      .nullable()
      .optional(),
    ath_date: record(string(), string()).nullable().optional(),
    atl: record(string(), number().nullable()).nullable().optional(),
    atl_change_percentage: record(string(), number().nullable())
      .nullable()
      .optional(),
    atl_date: record(string(), string().nullable()).nullable().optional(),
    market_cap: record(string(), number().nullable()).nullable().optional(),
    market_cap_rank: number().nullable().optional(),
    fully_diluted_valuation: record(string(), number().nullable())
      .nullable()
      .optional(),
    total_volume: record(string(), number().nullable()).nullable().optional(),
    total_value_locked: record(string(), number().nullable())
      .nullable()
      .optional(),
    high_24h: record(string(), number().nullable()).nullable().optional(),
    low_24h: record(string(), number().nullable()).nullable().optional(),
    price_change_24h: number().nullable().optional(),
    price_change_percentage_24h: number().nullable().optional(),
    price_change_percentage_7d: number().nullable().optional(),
    price_change_percentage_14d: number().nullable().optional(),
    price_change_percentage_30d: number().nullable().optional(),
    price_change_percentage_60d: number().nullable().optional(),
    price_change_percentage_200d: number().nullable().optional(),
    price_change_percentage_1y: number().nullable().optional()
  })
    .nullable()
    .optional(),
  tickers: object({
    base: string().nullable().optional(),
    target: string().nullable().optional(),
    market: object({
      name: string().nullable().optional(),
      identifier: string().nullable().optional(),
      has_trading_incentive: boolean().nullable().optional()
    })
      .nullable()
      .optional(),
    last: number().nullable().optional(),
    volume: number().nullable().optional(),
    converted_last: object({
      btc: number().nullable().optional(),
      eth: number().nullable().optional(),
      usd: number().nullable().optional()
    })
      .nullable()
      .optional(),
    converted_volume: object({
      btc: number().nullable().optional(),
      eth: number().nullable().optional(),
      usd: number().nullable().optional()
    })
      .nullable()
      .optional(),
    trust_score: string().nullable().optional(),
    bid_ask_spread_percentage: number().nullable().optional(),
    timestamp: string().nullable().optional(),
    last_traded_at: string().nullable().optional(),
    last_fetch_at: string().nullable().optional(),
    is_anomaly: boolean().nullable().optional(),
    is_stale: boolean().nullable().optional(),
    trade_url: string().nullable().optional(),
    token_info_url: string().nullable().optional(),
    coin_id: string().nullable().optional(),
    target_coin_id: string().nullable().optional()
  })
    .array()
    .nullable()
    .optional(),
  description: record(string(), string().nullable()).nullable().optional(),
  contract_address: string().optional().nullable(),
  sentiment_votes_up_percentage: number().nullable().optional(),
  sentiment_votes_down_percentage: number().nullable().optional(),
  market_cap_rank: number().nullable().optional(),
  coingecko_rank: number().nullable().optional(),
  coingecko_score: number().nullable().optional(),
  developer_score: number().nullable().optional(),
  community_score: number().nullable().optional(),
  liquidity_score: number().nullable().optional(),
  public_interest_score: number().nullable().optional(),
  community_data: object({
    facebook_likes: number().nullable().optional(),
    twitter_followers: number().nullable().optional(),
    reddit_average_posts_48h: number().nullable().optional(),
    reddit_average_comments_48h: number().nullable().optional(),
    reddit_subscribers: number().nullable().optional(),
    reddit_accounts_active_48h: number().nullable().optional(),
    telegram_channel_user_count: number().nullable().optional()
  })
    .nullable()
    .optional()
})

export type CoinsContractInfoResponse = z.infer<
  typeof CoinsContractInfoResponseSchema
>

export type CoinsInfoResponse = Omit<
  CoinsContractInfoResponse,
  'contract_address'
>

export const RawSimplePriceResponseSchema = record(
  record(number().nullable().optional())
)
export type RawSimplePriceResponse = z.infer<
  typeof RawSimplePriceResponseSchema
>
