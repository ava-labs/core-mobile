import {
  EventResponse,
  ListMarketQuotesResponse,
  QuoteResponse
} from '@avalabs/prediction-market-sdk'
import { GraphPoint } from 'react-native-graph'
import { MarketWithQuotes, PredictionsEventMarket } from './types'

export function normalizeEventMarkets(
  markets: EventResponse['markets']
): PredictionsEventMarket[] {
  return (markets ?? []).map(m => ({ ...m, tickerId: m.ticker }))
}

export function attachQuotesToMarkets({
  markets,
  quotesData,
  isFetching = false,
  isError = false
}: {
  markets: PredictionsEventMarket[]
  quotesData?: ListMarketQuotesResponse
  isFetching?: boolean
  isError?: boolean
}): MarketWithQuotes[] {
  const quotesById = new Map<
    string,
    { yesQuote: QuoteResponse; noQuote: QuoteResponse }
  >()

  for (const quote of quotesData?.quotes ?? []) {
    quotesById.set(quote.tickerId, {
      yesQuote: quote.yesQuote,
      noQuote: quote.noQuote
    })
  }

  return markets.map(market => {
    const quotes = quotesById.get(market.tickerId)

    return {
      ...market,
      yesQuote: quotes?.yesQuote,
      noQuote: quotes?.noQuote,
      isLoadingQuotes: isFetching && !quotesById.has(market.tickerId),
      isQuotesError: isError && !quotesById.has(market.tickerId)
    }
  })
}

// TODO: Remove seededRandom, generateHistory and tickerToSeed once the SDK
// returns real historical market series. They only exist to fake sparkline
// data for the EventDetails UI.
// Numerical Recipes LCG constants.
const LCG_MULTIPLIER = 1664525
const LCG_INCREMENT = 1013904223
const LCG_MODULUS_MASK = 0xffffffff
const LCG_NORMALIZER = 0x100000000

export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * LCG_MULTIPLIER + LCG_INCREMENT) & LCG_MODULUS_MASK
    return (s >>> 0) / LCG_NORMALIZER
  }
}

export function generateHistory(
  finalProbability: number,
  tickerSeed: number,
  optionIndex: number
): GraphPoint[] {
  const rand = seededRandom(tickerSeed + optionIndex * 1000)
  const now = Date.now()
  const msPerDay = 86400000

  const points: GraphPoint[] = []
  let value = Math.max(
    0.01,
    Math.min(0.99, finalProbability + (rand() - 0.5) * 0.3)
  )

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * msPerDay)
    if (i === 0) {
      value = finalProbability
    } else {
      const delta = (rand() - 0.5) * 0.05
      value = Math.max(0.01, Math.min(0.99, value + delta))
    }
    points.push({ date, value })
  }
  return points
}

export function tickerToSeed(tickerId: string): number {
  return tickerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

export function hasAvailableQuote(quote?: QuoteResponse): boolean {
  if (quote === undefined) {
    return false
  }
  const SENTINEL_BID_PRICE = '-0.03'
  const SENTINEL_ASK_PRICE = '1.03'

  return !(
    quote.maxBidPrice === SENTINEL_BID_PRICE &&
    quote.minAskPrice === SENTINEL_ASK_PRICE
  )
}

export function hasAvailableMarketQuotes(
  yesQuote?: QuoteResponse,
  noQuote?: QuoteResponse
): boolean {
  return hasAvailableQuote(yesQuote) || hasAvailableQuote(noQuote)
}
