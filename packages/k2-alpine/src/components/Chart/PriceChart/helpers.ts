import type { Skia } from '@shopify/react-native-skia'
import { PriceChangeStatus } from '../../PriceChangeIndicator/types'
import {
  CHART_INSET,
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

/** Sentinel for "no candle is highlighted" in a `VolumeCrossfade` — no
 * candle index is ever negative. */
export const NO_HIGHLIGHT_INDEX = -1

export type VolumeCrossfade = {
  lowIndex: number
  highIndex: number
  /** 1 when the crosshair sits exactly on `lowIndex`, 0 when it has drifted
   * all the way to `highIndex`. */
  lowWeight: number
  /** 1 when the crosshair sits exactly on `highIndex`, 0 when it has
   * drifted all the way to `lowIndex`. `lowWeight + highWeight === 1`
   * whenever a highlight is active. */
  highWeight: number
}

/** Nothing highlighted — both indices are the sentinel, both weights 0. */
export const IDLE_VOLUME_CROSSFADE: VolumeCrossfade = {
  lowIndex: NO_HIGHLIGHT_INDEX,
  highIndex: NO_HIGHLIGHT_INDEX,
  lowWeight: 0,
  highWeight: 0
}

/**
 * Two-bar crossfade weights for `VolumeRow`'s crosshair highlight —
 * restores main's original per-candle interpolation (each candle's opacity
 * was `ACTIVE - (ACTIVE - IDLE) * distance` for `distance = |fracIndex -
 * i| < 1`, `IDLE` otherwise, where `fracIndex` is the crosshair's position
 * in candle-index units) without reintroducing one `SharedValue` per
 * candle: at most two candles — `floor(fracIndex)` and `ceil(fracIndex)` —
 * can ever be within one candle-width of the crosshair, so this returns
 * just those two plus a 0-1 weight each. `IDLE + (ACTIVE - IDLE) * weight`
 * per side is main's target *composite* opacity for that candle (weight is
 * `1 - distance` for that side) — see `crossfadeRectOpacity` for how
 * `VolumeRow` actually paints a rect to land on that target once its
 * static idle `Path` (drawn underneath, at `VOLUME_IDLE_OPACITY`) is
 * composited in too.
 *
 * Purely geometric — callers gate on crosshair-active state themselves
 * (see `VolumeRow`'s `useAnimatedReaction`) and fall back to
 * `IDLE_VOLUME_CROSSFADE` when inactive, so this only needs to guard
 * against a degenerate track.
 *
 * Worklet — called from a `useAnimatedReaction` on the UI thread.
 */
export const volumeCrosshairWeights = (
  x: number,
  candleCount: number,
  innerWidth: number
): VolumeCrossfade => {
  'worklet'
  if (candleCount <= 1 || innerWidth <= 0) {
    return IDLE_VOLUME_CROSSFADE
  }
  const last = candleCount - 1
  const fracIndex = Math.max(
    0,
    Math.min(last, ((x - CHART_INSET) / innerWidth) * last)
  )
  const lowIndex = Math.floor(fracIndex)
  const highIndex = Math.min(last, lowIndex + 1)
  const highWeight = fracIndex - lowIndex
  const lowWeight = 1 - highWeight
  return { lowIndex, highIndex, lowWeight, highWeight }
}

/** Idle opacity of every bar in `VolumeRow`'s static `Path` — including
 * the two candles a highlight rect may be drawn on top of. */
export const VOLUME_IDLE_OPACITY = 0.1
/** Fully-highlighted opacity a candle reaches when the crosshair sits
 * exactly on it. */
export const VOLUME_ACTIVE_OPACITY = 1

/**
 * `VolumeRow` paints a highlight rect ON TOP OF its static idle `Path`,
 * which already painted that same bar at `VOLUME_IDLE_OPACITY` — the two
 * source-over layers are the same color, so they don't blend hues, but
 * their alphas still combine as `1 - (1 - VOLUME_IDLE_OPACITY) * (1 -
 * rectOpacity)`. Painting the rect at the raw target opacity (`IDLE +
 * (ACTIVE - IDLE) * weight`, see `volumeCrosshairWeights`) would double-count
 * the idle layer's contribution and overshoot the target everywhere except
 * `weight` 0 and 1. Solving `1 - (1 - IDLE) * (1 - rectOpacity) = IDLE +
 * (ACTIVE - IDLE) * weight` for `rectOpacity` gives:
 *
 *   rectOpacity = (ACTIVE - IDLE) * weight / (1 - IDLE)
 *
 * With the current constants (`ACTIVE = 1`, `IDLE = 0.1`) the `(1 - IDLE)`
 * factors cancel and this simplifies to exactly `weight` — kept as the
 * general formula (rather than hardcoding that simplification) so the
 * compositing invariant survives either constant changing.
 *
 * `weight = 0` maps to `rectOpacity = 0` — a fully transparent rect is a
 * true no-op, so the bar is left showing exactly the idle `Path`'s
 * `VOLUME_IDLE_OPACITY`, not something inflated by a stray draw.
 * `weight = 1` maps to `rectOpacity = 1`, matching `VOLUME_ACTIVE_OPACITY`
 * (an opaque top layer fully occludes the idle layer beneath it, so
 * stacking order/count beyond that doesn't matter — this is also why the
 * last-candle edge case, where `lowIndex === highIndex` and both rects
 * draw at the same spot, still lands exactly on `VOLUME_ACTIVE_OPACITY`).
 *
 * Worklet — called from `useDerivedValue` callbacks on the UI thread.
 */
export const crossfadeRectOpacity = (weight: number): number => {
  'worklet'
  return (
    ((VOLUME_ACTIVE_OPACITY - VOLUME_IDLE_OPACITY) * weight) /
    (1 - VOLUME_IDLE_OPACITY)
  )
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

// Hand-rolled to avoid ~4ms/call Intl JSI crossings (~96 calls/mount).
// Hardcodes en-US regardless of device locale -- Open decision #2 (doc
// §15.7), not yet resolved. CP-14918.
const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]
const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`)

/** Matches `Intl.DateTimeFormat.prototype.format`'s `RangeError: Invalid
 * time value` for a NaN-time `Date`, so hand-rolled formatters fail the same
 * way the Intl-based ones they replace did. */
const assertValidDate = (d: Date): void => {
  if (Number.isNaN(d.getTime())) {
    throw new RangeError('Invalid time value')
  }
}

/** en-US `{ month: 'short', day: 'numeric' }` — e.g. "Apr 29". No leading
 * zero on day. */
const formatMonthDay = (d: Date): string => {
  assertValidDate(d)
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}

/**
 * `{ hour: 'numeric', minute: '2-digit', hour12: false }`-equivalent,
 * zero-padded to 2 digits, hours 0-23 (h23), e.g. midnight -> "00:00".
 *
 * Emits `00:00` for midnight, not Node ICU's `24:00` -- matches
 * Hermes/Android ICU (h23). Do not revert; `helpers.test.ts` pins this.
 * CP-14918.
 */
const formatHour24Minute = (d: Date): string => {
  assertValidDate(d)
  const hour = d.getHours()
  return `${pad2(hour)}:${pad2(d.getMinutes())}`
}

/** en-US `{ hour: 'numeric', minute: '2-digit' }` (hour12 defaults to true
 * for en-US) — e.g. "9:41\u202fAM", "12:00\u202fPM". Hour is NOT
 * zero-padded; minute is.
 *
 * `AM_PM_SEPARATOR` must stay U+202F (narrow no-break space), not ASCII
 * space -- matches Hermes/Android ICU 72+. Byte-pinned by
 * `helpers.test.ts`; do not "clean up" back to a plain space. CP-14918.
 */
const AM_PM_SEPARATOR = '\u202f' // NARROW NO-BREAK SPACE — see doc comment above.

const formatHour12Minute = (d: Date): string => {
  assertValidDate(d)
  const hour = d.getHours()
  const period = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${pad2(d.getMinutes())}${AM_PM_SEPARATOR}${period}`
}

/** en-US `{ weekday: 'short', month: 'short', day: 'numeric', year:
 * 'numeric' }` — e.g. "Wed, Apr 29, 2026". */
const formatWeekdayMonthDayYear = (d: Date): string => {
  assertValidDate(d)
  return `${WEEKDAY_ABBR[d.getDay()]}, ${
    MONTH_ABBR[d.getMonth()]
  } ${d.getDate()}, ${d.getFullYear()}`
}

/** e.g. "Last update: Wed, Apr 29, 2026 at 9:41 AM" */
export const formatLastUpdate = (ts: number): string => {
  const d = new Date(ts)
  const datePart = formatWeekdayMonthDayYear(d)
  const timePart = formatHour12Minute(d)
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

type CandleDisplayStrings = {
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

/** Single-candle body shared by `formatCandleDisplayStrings` (all candles)
 * and `formatCandleDisplayStringAt` (one candle) so the two paths are
 * byte-for-byte identical — the deferred full-array computation must never
 * disagree with the eager single-candle one it stands in for at mount. */
const formatCandleEntry = (
  candle: OhlcCandle,
  firstOpen: number,
  formatPrice: (amount: number) => string
): CandleDisplayStrings => {
  const close = Number.isFinite(candle.close) ? candle.close : 0
  const delta = close - firstOpen
  const deltaPct =
    Number.isFinite(firstOpen) && firstOpen !== 0
      ? (delta / firstOpen) * 100
      : 0
  const safeDelta = Number.isFinite(delta) ? delta : 0
  const safeDeltaPct = Number.isFinite(deltaPct) ? deltaPct : 0
  return {
    priceText: formatPrice(close),
    timeText: formatActiveTime(candle.ts),
    deltaPriceText: formatPrice(Math.abs(safeDelta)),
    deltaPctText: `${Math.abs(safeDeltaPct).toFixed(2)}%`,
    status: priceChangeStatusFromDelta(safeDelta)
  }
}

/** Pre-compute header strings per candle for drag-time lookups. */
export const formatCandleDisplayStrings = (
  candles: OhlcCandle[],
  formatPrice: (amount: number) => string
): CandleDisplayStrings[] => {
  const firstOpen = candles[0]?.open ?? 0
  return candles.map(c => formatCandleEntry(c, firstOpen, formatPrice))
}

/**
 * O(1) variant of `formatCandleDisplayStrings` for a single candle index —
 * lets a mount-time render compute only the one entry it actually displays
 * (the crosshair-inactive state only ever reads the last candle) instead of
 * paying the ~96 `Intl.format()` calls for all candles up front. The full
 * array is computed lazily elsewhere (see `useIsFullFormatNeeded` in
 * `hooks.ts`) for crosshair-drag lookups.
 */
export const formatCandleDisplayStringAt = (
  candles: OhlcCandle[],
  index: number,
  formatPrice: (amount: number) => string
): CandleDisplayStrings | undefined => {
  const candle = candles[index]
  if (!candle) return undefined
  const firstOpen = candles[0]?.open ?? 0
  return formatCandleEntry(candle, firstOpen, formatPrice)
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

/** e.g. "Today, 07:25" or "Apr 29, 07:25" — 24-hour (h23, midnight = "00"),
 * no AM/PM. See the CP-14918 comment above `MONTH_ABBR` for why this is
 * hand-rolled instead of an `Intl.DateTimeFormat`, and the comment above
 * `formatHour24Minute` for the h23-vs-h24 midnight correction. */
export const formatActiveTime = (ts: number, nowMs?: number): string => {
  const d = new Date(ts)
  const now = nowMs !== undefined ? new Date(nowMs) : new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const datePart = sameDay ? 'Today' : formatMonthDay(d)
  const timePart = formatHour24Minute(d)
  return `${datePart}, ${timePart}`
}

/**
 * Pure gating decision behind `useIsFullFormatNeeded` (hooks.ts), pulled out
 * here (no reanimated dependency) so it's unit-testable without mounting a
 * component — this package has no component-render test harness. The full
 * "format every candle" array is needed once EITHER the post-mount idle
 * tick has fired OR the crosshair has been activated at least once (`idx`
 * non-null) — whichever happens first.
 */
export const isFullFormatNeeded = (
  idleReady: boolean,
  idx: number | null
): boolean => idleReady || idx !== null

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
