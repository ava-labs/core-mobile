import { PriceChangeStatus } from '@avalabs/k2-alpine'
import {
  PerpetualMarket,
  Position,
  PositionEntry,
  PositionsSummary
} from './types'

export const POSITIONS_MOCK: Position[] = [
  {
    id: 'eth-long',
    symbol: 'ETH',
    side: 'long',
    leverage: 40,
    price: 1973.1,
    pnl: -0.01,
    pnlStatus: PriceChangeStatus.Down,
    takeProfit: 0,
    stopLoss: 0
  },
  {
    id: 'sol-long',
    symbol: 'SOL',
    side: 'long',
    leverage: 20,
    price: 1973.1,
    pnl: -0.01,
    pnlStatus: PriceChangeStatus.Down,
    takeProfit: 0,
    stopLoss: 0
  }
]

export const MY_POSITIONS_MOCK: Position[] = [
  {
    id: 'nvda-long',
    symbol: 'NVDA',
    side: 'long',
    leverage: 2,
    price: 176.18,
    pnl: -0.01,
    pnlStatus: PriceChangeStatus.Down,
    takeProfit: 0,
    stopLoss: 0,
    liquidationPrice: 62.27,
    liquidationDistance: -3.8,
    markPrice: 75.98,
    entryPrice: 75.97,
    funding: -0.0
  },
  {
    id: 'doge-long',
    symbol: 'DOGE',
    side: 'long',
    leverage: 5,
    price: 1.74,
    pnl: -0.01,
    pnlStatus: PriceChangeStatus.Down,
    takeProfit: 1.5,
    stopLoss: 0,
    liquidationPrice: 2.05,
    liquidationDistance: -3.8,
    markPrice: 1.74,
    entryPrice: 1.74,
    funding: -0.0
  },
  {
    id: 'eth-long-2',
    symbol: 'ETH',
    side: 'long',
    leverage: 40,
    price: 1973.1,
    pnl: 0.01,
    pnlStatus: PriceChangeStatus.Up,
    takeProfit: 2000,
    stopLoss: 0,
    liquidationPrice: 1840.5,
    liquidationDistance: -6.72,
    markPrice: 1973.1,
    entryPrice: 1970.4,
    funding: -0.0
  }
]

export const POSITIONS_SUMMARY_MOCK: PositionsSummary = {
  openPositions: 3,
  changePercent: 0.75,
  changeStatus: PriceChangeStatus.Up,
  pnl: 0.75,
  pnlStatus: PriceChangeStatus.Up
}

export const PERP_MARKETS_MOCK: PerpetualMarket[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    rank: 1,
    volume: 1680000000,
    price: 67595,
    changePercent: 0.98,
    changeStatus: PriceChangeStatus.Up,
    tags: ['40×']
  },
  {
    id: 'eth',
    symbol: 'ETH',
    rank: 2,
    volume: 532200000,
    price: 1973.1,
    changePercent: 0.14,
    changeStatus: PriceChangeStatus.Down,
    tags: ['25×']
  },
  {
    id: 'cl',
    symbol: 'CL',
    rank: 3,
    volume: 168300000,
    price: 90.93,
    changePercent: 0.65,
    changeStatus: PriceChangeStatus.Up,
    tags: ['20×', 'xyz']
  },
  {
    id: 'sol',
    symbol: 'SOL',
    rank: 4,
    volume: 160700000,
    price: 83.344,
    changePercent: 0.95,
    changeStatus: PriceChangeStatus.Down,
    tags: ['20×']
  },
  {
    id: 'hype',
    symbol: 'HYPE',
    rank: 5,
    volume: 148300000,
    price: 30.433,
    changePercent: 1.95,
    changeStatus: PriceChangeStatus.Down,
    tags: ['10×']
  },
  {
    id: 'xyz100',
    symbol: 'XYZ100',
    rank: 6,
    volume: 118100000,
    price: 24440,
    changePercent: 0.05,
    changeStatus: PriceChangeStatus.Up,
    tags: ['20×', 'xyz']
  },
  {
    id: 'nvda',
    symbol: 'NVDA',
    rank: 7,
    volume: 49600000,
    price: 176.18,
    changePercent: 1.01,
    changeStatus: PriceChangeStatus.Up,
    tags: ['20×', 'xyz']
  },
  {
    id: 'silver',
    symbol: 'SILVER',
    rank: 8,
    volume: 45800000,
    price: 84.683,
    changePercent: 0.31,
    changeStatus: PriceChangeStatus.Down,
    tags: ['25×', 'xyz']
  },
  {
    id: 'hype-usdc',
    symbol: 'HYPE/USDC',
    rank: 9,
    volume: 39500000,
    price: 30.43,
    changePercent: 0.95,
    changeStatus: PriceChangeStatus.Up,
    tags: ['SPOT']
  },
  {
    id: 'usa500',
    symbol: 'USA500',
    rank: 10,
    volume: 33800000,
    price: 6685.1,
    changePercent: 1.051,
    changeStatus: PriceChangeStatus.Down,
    tags: ['20×', 'cash']
  },
  {
    id: 'brentoil',
    symbol: 'BRENTOIL',
    rank: 11,
    volume: 25900000,
    price: 92.705,
    changePercent: 0.94,
    changeStatus: PriceChangeStatus.Up,
    tags: ['20×', 'xyz']
  },
  {
    id: 'mu',
    symbol: 'MU',
    rank: 12,
    volume: 24800000,
    price: 363.3,
    changePercent: 1.9,
    changeStatus: PriceChangeStatus.Down,
    tags: ['10×', 'xyz']
  },
  {
    id: 'gold',
    symbol: 'GOLD',
    rank: 13,
    volume: 20000000,
    price: 5173.0,
    changePercent: 0.97,
    changeStatus: PriceChangeStatus.Down,
    tags: ['SPOT']
  },
  {
    id: 'zec',
    symbol: 'ZEC',
    rank: 14,
    volume: 14600000,
    price: 1206.66,
    changePercent: 0.05,
    changeStatus: PriceChangeStatus.Up,
    tags: ['10×']
  }
]

export const POSITIONS_HISTORY_MOCK: PositionEntry[] = [
  {
    id: 'eth-long-closed-1',
    symbol: 'ETH',
    side: 'long',
    outcome: 'Long closed',
    size: 12.75,
    avgPrice: 63.54,
    pnl: 1.75,
    pnlStatus: PriceChangeStatus.Up,
    dateLabel: 'Yesterday',
    timeLabel: '2:57 PM'
  },
  {
    id: 'eth-long-closed-2',
    symbol: 'ETH',
    side: 'long',
    outcome: 'Long closed',
    size: 12.75,
    avgPrice: 63.54,
    dateLabel: 'Yesterday',
    timeLabel: '2:57 PM'
  },
  {
    id: 'btc-short-closed-1',
    symbol: 'BTC',
    side: 'short',
    outcome: 'Short closed',
    size: 12.75,
    avgPrice: 63.54,
    pnl: 0.85,
    pnlStatus: PriceChangeStatus.Up,
    dateLabel: '02/28/26',
    timeLabel: '12:34 PM'
  },
  {
    id: 'btc-short-closed-2',
    symbol: 'BTC',
    side: 'short',
    outcome: 'Short closed',
    size: 12.75,
    avgPrice: 63.54,
    dateLabel: '02/27/26',
    timeLabel: '12:34 PM'
  }
]
