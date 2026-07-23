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

/**
 * Isolated-margin liquidation estimate from the margin backing the position,
 * for flows that change the collateral rather than the leverage (adjust
 * margin). Mirrors Hyperliquid's formula
 *   liq = entry − side · marginAvailable / size / (1 − mmf · side)
 * with `mmf = 1 / (2 · maxLeverage)`; written per-unit-of-notional it reduces
 * to the closed forms below. Returns `NaN` for invalid inputs or when a long
 * is collateralized enough that its liquidation would fall at/below 0
 * (callers should then omit the estimate).
 */
export const estimateLiquidationPriceFromMargin = ({
  entryPrice,
  isLong,
  maxLeverage,
  notionalUsd,
  marginUsd
}: {
  entryPrice: number
  isLong: boolean
  maxLeverage: number
  /** Position notional in USD (size × entry). */
  notionalUsd: number
  /** Margin (equity) backing the position after the adjustment. */
  marginUsd: number
}): number => {
  if (
    !Number.isFinite(entryPrice) ||
    entryPrice <= 0 ||
    !Number.isFinite(maxLeverage) ||
    maxLeverage <= 0 ||
    !Number.isFinite(notionalUsd) ||
    notionalUsd <= 0 ||
    !Number.isFinite(marginUsd) ||
    marginUsd <= 0
  ) {
    return Number.NaN
  }
  const maintenanceMarginFraction = 1 / (2 * maxLeverage)
  // Per-notional buffer: equity backing the position, less the maintenance it
  // must keep.
  const buffer = marginUsd / notionalUsd - maintenanceMarginFraction
  if (isLong) {
    const liq = entryPrice * (1 - buffer / (1 - maintenanceMarginFraction))
    return liq > 0 ? liq : Number.NaN
  }
  return entryPrice * (1 + buffer / (1 + maintenanceMarginFraction))
}

/**
 * Max isolated margin the user can withdraw without Hyperliquid rejecting the
 * reduction ("position does not have sufficient margin for reduction").
 *
 * Per HL's margining rules, after any margin removal the remaining position
 * equity must satisfy
 *   transfer_margin_required = max(initial_margin_required, 0.1 · notional)
 * where `initial_margin_required = notional / leverage` (the position's own
 * set leverage, NOT the market max). Unrealized PnL counts toward the
 * remaining equity, so
 *   removable = (marginUsed + unrealizedPnl) − max(notional/leverage, 0.1·notional)
 * A roughly flat position at its set leverage therefore has ~0 removable
 * (matches HL). Capped at the deposited margin and to `0` when leverage /
 * notional are unknown, with a 2% cushion for price drift before submit.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining
 */
export const maxRemovableMarginUsd = ({
  marginUsed,
  unrealizedPnl,
  notionalUsd,
  leverage
}: {
  marginUsed: number
  unrealizedPnl: number
  /** Position notional in USD (size × entry). */
  notionalUsd: number
  /** The position's set leverage. */
  leverage: number
}): number => {
  if (
    !Number.isFinite(leverage) ||
    leverage <= 0 ||
    !Number.isFinite(notionalUsd) ||
    notionalUsd <= 0 ||
    !Number.isFinite(marginUsed)
  ) {
    return 0
  }
  const equity =
    marginUsed + (Number.isFinite(unrealizedPnl) ? unrealizedPnl : 0)
  const transferFloor = Math.max(notionalUsd / leverage, 0.1 * notionalUsd)
  const removable = (equity - transferFloor) * 0.98
  return Math.max(0, Math.min(marginUsed, removable))
}

/**
 * Floor to `decimals` places so a quick-amount preset can't round *up* past
 * the true cap and trip validation / HL's margin-reduction check.
 */
export const floorToDecimals = (value: number, decimals: number): number => {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  return Math.max(0, Math.floor(value * factor) / factor)
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
