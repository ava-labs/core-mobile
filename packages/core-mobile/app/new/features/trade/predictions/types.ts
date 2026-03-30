import {
  EventDetailResponse,
  EventResponse,
  MarketBase,
  QuoteResponse
} from '@avalabs/prediction-market-sdk'

export type KycStatus = 'idle' | 'pending' | 'approved' | 'rejected'

/**
 * Minimal market shape stored in Redux.
 * Full SDK type (TradableMarket) is used in React Query hooks — this is just
 * enough to drive the tab badge count and cross-screen navigation.
 */
export type MarketSummary = {
  tickerId: string
  title: string
}

export type PredictionsEventMarket = MarketBase & {
  tickerId: string
}

export type MarketWithQuotes = PredictionsEventMarket & {
  yesQuote?: QuoteResponse
  noQuote?: QuoteResponse
  isLoadingQuotes?: boolean
  isQuotesError?: boolean
}

export type EventWithMarkets = Omit<EventResponse, 'markets'> & {
  markets: MarketWithQuotes[]
}

export type EventDetailWithMarkets = Omit<EventDetailResponse, 'markets'> & {
  markets: MarketWithQuotes[]
}
