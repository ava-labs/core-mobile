// Pure position-economics helpers shared across the perpetuals order /
// trigger / close / manage screens. UI-only approximations until the SDK's
// clearinghouseState is wired — see MOCK_* below.

export type TriggerKind = 'takeProfit' | 'stopLoss'

export interface PnlColors {
  $textSuccess: string
  $textDanger: string
}

// Mock placeholders to delete once the SDK provides real account state.
export const MOCK_AVAILABLE_BALANCE = 150
export const MOCK_POSITION_VALUE = 4.64
export const MOCK_PNL = 1.18
export const DEFAULT_COIN = 'NVDA'
export const DEFAULT_ENTRY_PRICE = 62.78
export const DEFAULT_MAX_LEVERAGE = 40

/** Isolated-margin liquidation estimate from entry, leverage and direction. */
export const estimateLiquidationPrice = (
  entryPrice: number,
  leverage: number,
  isLong: boolean
): number => {
  if (leverage <= 0) return entryPrice
  const delta = entryPrice / leverage
  return isLong ? entryPrice - delta : entryPrice + delta
}

/** Position size in tokens implied by collateral × leverage at entry. */
export const positionSizeTokens = (
  collateral: number,
  leverage: number,
  entryPrice: number
): number => (entryPrice > 0 ? (collateral * leverage) / entryPrice : 0)

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
 * A take-profit only makes sense on the profitable side of entry (long:
 * above, short: below); a stop-loss on the losing side. Anything else (or a
 * non-positive price) is rejected so we never store a contradictory trigger.
 */
export const isTriggerValid = ({
  kind,
  isLong,
  price,
  entryPrice
}: {
  kind: TriggerKind
  isLong: boolean
  price: number | undefined
  entryPrice: number
}): boolean => {
  if (price === undefined || price <= 0 || entryPrice <= 0) return false
  const above = price > entryPrice
  if (kind === 'takeProfit') return isLong ? above : !above
  return isLong ? !above : above
}
