import type { Skia } from '@shopify/react-native-skia'
import { PriceChangeStatus } from '../../PriceChangeIndicator/types'
import {
  HEADER_LEFT_ZONE_THRESHOLD,
  HEADER_RIGHT_ZONE_THRESHOLD
} from './constants'
import { OhlcCandle } from './types'

type SkPath = ReturnType<typeof Skia.Path.Make>

/** Larger prices map to smaller y. Returns midpoint when min === max. */
export const priceToY = ({
  price,
  priceMin,
  priceMax,
  height
}: {
  price: number
  priceMin: number
  priceMax: number
  height: number
}): number => {
  const range = priceMax - priceMin
  if (range === 0) return height / 2
  return ((priceMax - price) / range) * height
}

export const indexToX = (
  index: number,
  candleCount: number,
  width: number
): number => {
  if (candleCount <= 1) return width / 2
  return (index / (candleCount - 1)) * width
}

/** Worklet — called from gesture-handler callbacks on the UI thread. */
export const touchXToIndex = (
  touchX: number,
  candleCount: number,
  width: number
): number => {
  'worklet'
  if (candleCount <= 0) return 0
  if (touchX < 0) return 0
  if (touchX > width) return candleCount - 1
  if (candleCount === 1) return 0
  const rounded = Math.round((touchX / width) * (candleCount - 1))
  return Math.max(0, Math.min(candleCount - 1, rounded))
}

export const rangeBounds = (
  candles: OhlcCandle[]
): { minPrice: number; maxPrice: number } => {
  if (candles.length === 0) return { minPrice: 0, maxPrice: 0 }
  const first = candles[0]
  if (!first) return { minPrice: 0, maxPrice: 0 }
  let minPrice = first.low
  let maxPrice = first.high
  for (const c of candles) {
    if (c.low < minPrice) minPrice = c.low
    if (c.high > maxPrice) maxPrice = c.high
  }
  return { minPrice, maxPrice }
}

/** e.g. "Last update: Wed, Apr 29, 2026 at 9:41 AM" */
export const formatLastUpdate = (ts: number): string => {
  const d = new Date(ts)
  const datePart = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
  return `Last update: ${datePart} at ${timePart}`
}

export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000_000) return `Vol. $${(vol / 1_000_000_000).toFixed(2)}B`
  if (vol >= 1_000_000) return `Vol. $${(vol / 1_000_000).toFixed(2)}M`
  if (vol >= 1_000) return `Vol. $${(vol / 1_000).toFixed(2)}K`
  return `Vol. $${vol.toFixed(2)}`
}

/** Catmull-Rom-to-Bezier smoothing — mutates `path`. */
export const traceSmoothLine = (
  path: SkPath,
  points: { x: number; y: number }[]
): void => {
  if (points.length === 0) return
  const first = points[0]
  if (!first) return
  path.moveTo(first.x, first.y)
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    if (!p0 || !p1 || !p2 || !p3) continue
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
}

export type CandleDisplayStrings = {
  priceText: string
  timeText: string
  deltaPriceText: string
  deltaPctText: string
  status: PriceChangeStatus
}

export const priceChangeStatusFromDelta = (
  delta: number
): PriceChangeStatus => {
  if (delta > 0) return PriceChangeStatus.Up
  if (delta < 0) return PriceChangeStatus.Down
  return PriceChangeStatus.Neutral
}

/** Pre-compute header strings per candle for drag-time lookups. */
export const formatCandleDisplayStrings = (
  candles: OhlcCandle[],
  formatPrice: (amount: number) => string
): CandleDisplayStrings[] => {
  const firstOpen = candles[0]?.open ?? 0
  return candles.map(c => {
    const close = Number.isFinite(c.close) ? c.close : 0
    const delta = close - firstOpen
    const deltaPct =
      Number.isFinite(firstOpen) && firstOpen !== 0
        ? (delta / firstOpen) * 100
        : 0
    const safeDelta = Number.isFinite(delta) ? delta : 0
    const safeDeltaPct = Number.isFinite(deltaPct) ? deltaPct : 0
    return {
      priceText: formatPrice(close),
      timeText: formatActiveTime(c.ts),
      deltaPriceText: formatPrice(Math.abs(safeDelta)),
      deltaPctText: `${Math.abs(safeDeltaPct).toFixed(2)}%`,
      status: priceChangeStatusFromDelta(safeDelta)
    }
  })
}

/** 0 = flex-start, 0.5 = center, 1 = flex-end — worklet for header zone reaction. */
export const crosshairInnerAnchorTarget = (
  isActive: boolean,
  crosshairX: number,
  containerWidth: number
): number => {
  'worklet'
  if (!isActive || containerWidth <= 0) return 0
  if (crosshairX > HEADER_RIGHT_ZONE_THRESHOLD * containerWidth) return 1
  if (crosshairX > HEADER_LEFT_ZONE_THRESHOLD * containerWidth) return 0.5
  return 0
}

/** e.g. "Today, 7:25" or "Apr 29, 7:25" — 24-hour, no AM/PM. */
export const formatActiveTime = (ts: number, nowMs?: number): string => {
  const d = new Date(ts)
  const now = nowMs !== undefined ? new Date(nowMs) : new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const datePart = sameDay
    ? 'Today'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  })
  return `${datePart}, ${timePart}`
}

/** `count + 1` evenly-spaced values from min to max, inclusive. */
export const yAxisTicks = (
  min: number,
  max: number,
  count: number
): number[] => {
  if (min === max) return [min]
  const step = (max - min) / count
  const ticks: number[] = []
  for (let i = 0; i <= count; i++) {
    ticks.push(min + i * step)
  }
  return ticks
}
