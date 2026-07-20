import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { MAX_PERP_DECIMALS } from '../consts'

/** Parse a Hyperliquid decimal string to a finite number, or 0 when invalid. */
export const toNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (value === undefined) {
    return 0
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Fractional digits to render a perp's price with, from its size precision. */
export const pxDecimalsFor = (szDecimals: number): number =>
  Math.max(0, MAX_PERP_DECIMALS - szDecimals)

/**
 * Round an order size down to the coin's `szDecimals`. Hyperliquid requires
 * sizes quantized to exactly `szDecimals` fractional digits — the perps-sdk's
 * `floatToWire` throws ("causes rounding for …") on any extra precision, which
 * is exactly what a raw `collateral × leverage / price` division produces.
 * Floors (not nearest) so the resulting notional never exceeds the collateral
 * the user actually has.
 */
export const roundSizeToSzDecimals = (
  size: number,
  szDecimals: number
): number => {
  if (!Number.isFinite(size) || size <= 0) {
    return 0
  }
  const decimals = Math.max(0, Math.floor(szDecimals))
  const factor = 10 ** decimals
  // Nudge by a tiny epsilon before flooring so values that are just below a
  // clean quantum due to float error (e.g. 0.6371499999998) don't lose a tick.
  return Math.floor(size * factor + 1e-9) / factor
}

/** Map a signed change into the k2-alpine price-change status enum. */
export const changeStatusOf = (change: number): PriceChangeStatus => {
  if (change > 0) {
    return PriceChangeStatus.Up
  }
  if (change < 0) {
    return PriceChangeStatus.Down
  }
  return PriceChangeStatus.Neutral
}

/**
 * 24h change as a signed fraction from the current mark price and the
 * previous day's close. Returns 0 when the previous close is missing/zero.
 */
export const dayChangeFraction = (markPx: number, prevDayPx: number): number =>
  prevDayPx > 0 ? (markPx - prevDayPx) / prevDayPx : 0
