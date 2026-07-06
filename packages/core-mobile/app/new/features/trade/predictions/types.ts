import {
  EventDetailResponse,
  EventResponse,
  MarketBase,
  QuoteResponse
} from '@avalabs/prediction-market-sdk'

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
