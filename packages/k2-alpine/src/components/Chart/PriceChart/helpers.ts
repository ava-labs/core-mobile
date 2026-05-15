import type { Skia } from '@shopify/react-native-skia'
import { OhlcCandle } from './types'

type SkPath = ReturnType<typeof Skia.Path.Make>

/**
 * Map a price to a y-pixel coordinate.
 * Larger prices map to smaller y (top of chart).
 * If priceMin === priceMax, returns the midpoint to avoid NaN.
 */
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

/**
 * Map a candle index to an x-pixel coordinate. Evenly distributed across width.
 * Single-candle input renders at the horizontal midpoint.
 */
export const indexToX = (
  index: number,
  candleCount: number,
  width: number
): number => {
  if (candleCount <= 1) return width / 2
  return (index / (candleCount - 1)) * width
}

/**
 * Map a touch x-pixel to the nearest candle index.
 * Clamps to [0, candleCount - 1]. Returns 0 for empty input.
 *
 * Marked as a worklet because it's called inside gesture-handler callbacks
 * that run on the UI thread (see PriceChart's Pan gesture).
 */
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

/**
 * Compute price min/max across a series of candles.
 * Empty input returns { minPrice: 0, maxPrice: 0 } to avoid NaN downstream.
 */
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

/**
 * Format a timestamp as e.g. "Last update: Wed, Apr 29, 2026 at 9:41 AM".
 * Used for the chart footer idle text.
 */
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

/**
 * Format a volume value as "Vol. $X" with K/M suffixes.
 */
export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000_000) return `Vol. $${(vol / 1_000_000_000).toFixed(2)}B`
  if (vol >= 1_000_000) return `Vol. $${(vol / 1_000_000).toFixed(2)}M`
  if (vol >= 1_000) return `Vol. $${(vol / 1_000).toFixed(2)}K`
  return `Vol. $${vol.toFixed(2)}`
}

/**
 * Trace `points` onto `path` using Catmull-Rom-to-Bezier so the line glides
 * smoothly through each point rather than zig-zagging. Mutates `path`.
 *
 * Tension is fixed at 1/6 — the standard Catmull-Rom-to-cubic-Bezier
 * conversion. Endpoints use a duplicated neighbor so the curve still
 * passes through them.
 */
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

/**
 * Format a timestamp as e.g. "Today, 7:25" or "Apr 29, 7:25" — used by the
 * chart header to label the active candle's bucket. 24-hour time, no AM/PM.
 */
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

/**
 * Generate `count + 1` evenly-spaced tick values from min to max, inclusive.
 * Returns `[min]` only when min === max.
 */
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
