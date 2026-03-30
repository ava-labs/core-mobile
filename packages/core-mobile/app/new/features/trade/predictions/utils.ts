import type { MarketBase } from '@avalabs/prediction-market-sdk'
import type { EventCardOption } from './components/EventCardOption'
import { GraphPoint } from 'react-native-graph'

/** Maps API markets to card rows; `lastPrice` is treated as probability (0–1 or 0–100). */
export function marketsToEventCardOptions(
  markets: MarketBase[] | null | undefined
): EventCardOption[] {
  if (markets == null || markets.length === 0) return []

  return markets.map(m => {
    const raw = parseFloat(m.lastPrice)
    let probability = Number.isFinite(raw) ? raw : 0
    if (probability > 1) probability /= 100
    probability = Math.min(1, Math.max(0, probability))

    const imageUrl =
      'imageUrl' in m &&
      typeof (m as MarketBase & { imageUrl?: string }).imageUrl === 'string'
        ? (m as MarketBase & { imageUrl: string }).imageUrl
        : undefined

    return {
      label: m.yesSubTitle || m.ticker,
      imageUrl,
      probability
    }
  })
}

export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
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
