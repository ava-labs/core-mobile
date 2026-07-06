import { PriceChangeStatus } from '@avalabs/k2-alpine'

export type PositionSide = 'long' | 'short'

export type Position = {
  id: string
  symbol: string
  side: PositionSide
  leverage: number
  /** Position size in tokens (base units). */
  size: number
  price: number
  pnl: number
  pnlStatus: PriceChangeStatus
  takeProfit: number
  stopLoss: number
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

export type PerpetualMarket = {
  id: string
  symbol: string
  rank: number
  volume: number
  price: number
  tags?: string[]
  changePercent: number
  changeStatus: PriceChangeStatus
  logoUri?: string
}
