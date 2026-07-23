// Pure position-economics helpers shared across the perpetuals order /
// trigger / close / manage screens.

export type TriggerKind = 'takeProfit' | 'stopLoss'

export interface PnlColors {
  $textSuccess: string
  $textDanger: string
}

/** Default market to open when a deep link omits the coin. */
export const FALLBACK_COIN = 'AVAX'

/**
 * Isolated-margin liquidation estimate from entry, leverage and direction.
 *
 * Liquidation happens when equity falls to the maintenance margin, which
 * Hyperliquid sets at roughly half the initial margin at max leverage —
 * `mmf ≈ 1 / (2 · maxLeverage)` of the notional. Because that requirement
 * scales with the notional *at the liquidation price*, the bound is:
 *   - long:  entry · (1 − 1/leverage) / (1 − mmf)
 *   - short: entry · (1 + 1/leverage) / (1 + mmf)
 * e.g. a 10× long at $100 on a 10×-max coin liquidates near $94.74, not $90.
 *
 * `maxLeverage` is optional: when it is unknown (0) the maintenance term drops
 * out and this reduces to the zero-maintenance bound (entry ± entry/leverage).
 * This remains an estimate — cross-margin liquidation additionally depends on
 * whole-account equity — so surfaces should label it as such.
 */
export const estimateLiquidationPrice = (
  entryPrice: number,
  leverage: number,
  isLong: boolean,
  maxLeverage = 0
): number => {
  if (leverage <= 0) return entryPrice
  const maintenanceMarginFraction = maxLeverage > 0 ? 1 / (2 * maxLeverage) : 0
  const side = isLong ? 1 : -1
  const denominator = 1 - side * maintenanceMarginFraction
  // Guard against a non-positive denominator (only possible with a degenerate
  // maxLeverage < 1); fall back to entry rather than emit a nonsensical price.
  if (denominator <= 0) return entryPrice
  return (entryPrice * (1 - side / leverage)) / denominator
}

/** Position size in tokens implied by USD position notional at entry. */
export const positionSizeTokens = (
  positionNotionalUsd: number,
  entryPrice: number
): number => (entryPrice > 0 ? positionNotionalUsd / entryPrice : 0)

/** Signed P&L of closing `sizeTokens` at `exitPrice` for the given side. */
export const projectedPnl = ({
  exitPrice,
  entryPrice,
  sizeTokens,
  isLong
}: {
  exitPrice: number
  entryPrice: number
  sizeTokens: number
  isLong: boolean
}): number => (exitPrice - entryPrice) * sizeTokens * (isLong ? 1 : -1)

/** % difference of `price` from `entryPrice` (0 when entry is non-positive). */
export const pctFromEntry = (price: number, entryPrice: number): number =>
  entryPrice > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0

/** Strip everything but digits and decimal points from a price input. */
export const sanitizeDecimalInput = (text: string): string =>
  text.replace(/[^0-9.]/g, '')

/**
 * Formats a signed amount via the provided currency formatter. Negatives get
 * `-`; positives get `+` unless `alwaysSign` is false (then no leading sign).
 */
export const formatSigned = (
  value: number,
  format: (amount: number) => string,
  { alwaysSign = true }: { alwaysSign?: boolean } = {}
): string => {
  const sign = value < 0 ? '-' : alwaysSign ? '+' : ''
  return `${sign}${format(Math.abs(value))}`
}

/** Green when positive, red when negative, `neutral` at zero/undefined. */
export const pnlColor = (
  value: number | undefined,
  colors: PnlColors,
  neutral: string
): string => {
  if (value === undefined || value === 0) return neutral
  return value > 0 ? colors.$textSuccess : colors.$textDanger
}

/**
 * The side of entry a trigger must sit on: a take-profit locks in profit
 * (long: above, short: below); a stop-loss caps loss (long: below, short:
 * above). The error message and the validity check both derive from this so
 * they can't disagree.
 */
export const requiredTriggerSide = (
  kind: TriggerKind,
  isLong: boolean
): 'above' | 'below' => ((kind === 'takeProfit') === isLong ? 'above' : 'below')

/**
 * Whether a trigger price sits on the side of the reference price that can
 * actually lock profit / cap loss. `referencePrice` should be the *live mark*,
 * not the position's entry: a trigger already on the wrong side of the current
 * price fires (or is rejected) the instant it's placed. In the open flow entry
 * equals live mark, so either reads the same there; the manage flow must pass
 * the live mark so a stale entry doesn't wave through an already-crossed trigger.
 */
export const isTriggerValid = ({
  kind,
  isLong,
  price,
  referencePrice
}: {
  kind: TriggerKind
  isLong: boolean
  price: number | undefined
  referencePrice: number
}): boolean => {
  if (price === undefined || price <= 0 || referencePrice <= 0) return false
  // Strict: a trigger exactly at the reference is neither above nor below, so it
  // can never lock profit / cap loss and must be rejected.
  return requiredTriggerSide(kind, isLong) === 'above'
    ? price > referencePrice
    : price < referencePrice
}

/**
 * Split a signed % (vs the current price) into a colored percent chunk and a
 * plain-suffix chunk ("+1.94%" / " above current price"). `emptyText` is the
 * whole suffix when no price is set yet.
 */
export const pctParts = (
  pct: number | undefined,
  emptyText = 'Set a price target'
): { percent: string; suffix: string } => {
  if (pct === undefined) return { percent: '', suffix: emptyText }
  // Zero is neither above nor below — e.g. a limit set exactly at the market.
  if (pct === 0) return { percent: '', suffix: 'At current price' }
  const sign = pct > 0 ? '+' : ''
  const direction = pct > 0 ? 'above' : 'below'
  return {
    percent: `${sign}${pct.toFixed(2)}%`,
    suffix: ` ${direction} current price`
  }
}
