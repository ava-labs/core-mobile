import { PriceChangeStatus } from '@avalabs/k2-alpine'

export type PositionSide = 'long' | 'short'

export type MarginMode = 'cross' | 'isolated'

export type Position = {
  id: string
  symbol: string
  side: PositionSide
  leverage: number
  /** Cross vs isolated margin, from the position's Hyperliquid leverage setting. */
  marginMode: MarginMode
  /** Position size in tokens (base units). */
  size: number
  price: number
  pnl: number
  pnlStatus: PriceChangeStatus
  takeProfit: number
  stopLoss: number
  /**
   * `true` while the open-orders feed has not yet produced a settled TP/SL for
   * this coin in the current session — the UI shows `-` rather than prematurely
   * rendering `None`. Once resolved it stays `false` (values are sticky).
   */
  triggersPending?: boolean
  logoUri?: string
  /** Liquidation price; absent if not applicable */
  liquidationPrice?: number
  /** Signed % distance from current price to liquidation */
  liquidationDistance?: number
  markPrice?: number
  entryPrice?: number
  funding?: number
}

export type PositionsSummary = {
  openPositions: number
  changePercent: number
  changeStatus: PriceChangeStatus
  pnl: number
  pnlStatus: PriceChangeStatus
}

export type PositionEntry = {
  id: string
  /**
   * Full Hyperliquid asset key. Native perps are bare tickers (e.g. "ETH");
   * HIP-3 (builder-deployed) markets are namespaced as "dex:TICKER" (e.g.
   * "xyz:GOLD"). Used to resolve the coin logo and dex badge — do not strip the
   * prefix here.
   */
  coin: string
  /** Display ticker without the dex prefix (e.g. "GOLD"). */
  symbol: string
  side: PositionSide
  /** e.g. "Long closed", "Short closed" */
  outcome: string
  /** Size in quote currency */
  size: number
  /** Average execution price */
  avgPrice: number
  /** Optional realised PnL; when present we show a colored pill */
  pnl?: number
  pnlStatus?: PriceChangeStatus
  /** Free-text date like "Yesterday" or "02/28/26" */
  dateLabel: string
  /** Free-text time like "2:57 PM" */
  timeLabel: string
  logoUri?: string
}

/**
 * Fields shared by every perp-market shape (raw data + display view model).
 * `changePercent`'s exact form differs per layer — see each extension — but the
 * price / volume / direction semantics are common.
 */
export type PerpMarketBase = {
  /**
   * Hyperliquid asset key. Native perps are bare tickers (e.g. "ETH"); HIP-3
   * (builder-deployed) markets are namespaced as "dex:TICKER" (e.g. "xyz:GOLD").
   */
  symbol: string
  /** Mark price in USD. */
  price: number
  /** 24h price change (see each extending type for its sign/scale). */
  changePercent: number
  /** Direction of the 24h change. */
  changeStatus: PriceChangeStatus
  /** 24h notional volume in USD. */
  volume: number
}

/**
 * Rich Hyperliquid-backed market data, flattened from `metaAndAssetCtxs`
 * (universe entry + live asset context) by `usePerpsMarkets` / `useHip3Markets`.
 * Here `changePercent` is a signed fraction (0.0123 = +1.23%). Adapted onto the
 * {@link PerpMarketView} display model in `hooks/usePerpetualMarkets.ts`.
 */
export type PerpMarketData = PerpMarketBase & {
  /** Builder dex name for HIP-3 markets, or "" for the native (main) dex. */
  dex: string
}

/**
 * Display view model for a perp-market list row, produced by
 * `usePerpetualMarkets` from {@link PerpMarketData}. Adds list-only concerns
 * (rank, category tags); here `changePercent` is a non-negative magnitude
 * percentage (direction lives in `changeStatus`), matching the row UI.
 */
export type PerpMarketView = PerpMarketBase & {
  id: string
  rank: number
  tags?: string[]
}
