import { PriceChangeStatus } from '@avalabs/k2-alpine'
import type {
  AssetPosition,
  InfoOrderStatusWire,
  OpenOrder,
  UserFill
} from '@avalabs/perps-sdk'
import {
  Position,
  PositionEntry,
  PositionsSummary,
  PositionSide
} from '../types'
import { tickerOfCoin } from './coinDex'
import { toNumber } from './format'

/** Open order that may or may not carry trigger / TP-SL metadata. */
type AnyOpenOrder = InfoOrderStatusWire | OpenOrder

/** Only the rich `frontendOpenOrders` rows carry trigger metadata. */
const isRichOrder = (order: unknown): order is InfoOrderStatusWire =>
  typeof order === 'object' && order !== null && 'isTrigger' in order

/** Take-profit and stop-loss trigger prices for a position (0 when unset). */
export type PositionTriggers = {
  takeProfit: number
  stopLoss: number
}

/** A resting position trigger order: its Hyperliquid order id and trigger price. */
export type PositionTriggerOrder = {
  readonly oid: number
  readonly triggerPx: number
}

/**
 * The position's on-book TP/SL trigger orders (with order ids), so the manage
 * flow can cancel them before placing replacements. `undefined` when a side has
 * no resting trigger. Only rich (main-dex) orders carry trigger metadata; HIP-3
 * (builder-dex) `openOrders` omit it, so those sides resolve to `undefined`.
 */
export type PositionTriggerOrders = {
  readonly takeProfit?: PositionTriggerOrder
  readonly stopLoss?: PositionTriggerOrder
}

type TriggerOrderAcc = {
  takeProfit?: PositionTriggerOrder
  stopLoss?: PositionTriggerOrder
}

/**
 * Fold a single rich trigger order (and any nested `children`) into the
 * accumulating TP/SL. Hyperliquid sometimes returns a position's TP/SL as two
 * top-level rows and sometimes as one parent row with the sibling nested under
 * `children`
 */
/** A reduce-only / position TP-SL trigger row for `coin` (children inherit coin). */
const isPositionTrigger = (
  order: InfoOrderStatusWire,
  coin: string
): boolean => {
  const orderCoin = order.coin ?? coin
  return Boolean(
    orderCoin === coin &&
      order.isTrigger &&
      (order.isPositionTpsl || order.reduceOnly)
  )
}

/** Assign a matched trigger (oid + price) to the TP or SL slot by its order type. */
const applyTrigger = (
  order: InfoOrderStatusWire,
  acc: TriggerOrderAcc
): void => {
  const triggerPx = toNumber(order.triggerPx)
  if (triggerPx <= 0) {
    return
  }
  const trigger: PositionTriggerOrder = { oid: order.oid, triggerPx }
  const type = order.orderType?.toLowerCase() ?? ''
  if (type.includes('take profit') || type.includes('tp')) {
    acc.takeProfit = trigger
  } else if (type.includes('stop') || type.includes('sl')) {
    acc.stopLoss = trigger
  }
}

const foldTriggerOrder = (
  order: InfoOrderStatusWire,
  coin: string,
  acc: TriggerOrderAcc
): void => {
  if (isPositionTrigger(order, coin)) {
    applyTrigger(order, acc)
  }

  const children = (order as { children?: readonly unknown[] }).children
  if (!Array.isArray(children)) {
    return
  }
  for (const child of children) {
    if (isRichOrder(child)) {
      foldTriggerOrder(child, coin, acc)
    }
  }
}

/**
 * Derive a position's TP/SL trigger orders (order id + trigger price) from the
 * account's open orders. Hyperliquid does not attach TP/SL to the clearinghouse
 * position — they are separate reduce-only trigger orders — so we match the
 * position-TP/SL triggers for `coin` (including ones nested as `children`) and
 * split them into take-profit vs stop-loss. The order ids let the manage flow
 * cancel the existing triggers before placing replacements.
 */
export const extractPositionTriggerOrders = (
  coin: string,
  orders: readonly AnyOpenOrder[]
): PositionTriggerOrders => {
  const acc: TriggerOrderAcc = {}
  for (const order of orders) {
    if (isRichOrder(order)) {
      foldTriggerOrder(order, coin, acc)
    }
  }
  return acc
}

/**
 * A position's TP/SL trigger *prices* (0 when unset), for display. Thin wrapper
 * over {@link extractPositionTriggerOrders} that drops the order ids.
 */
export const extractPositionTriggers = (
  coin: string,
  orders: readonly AnyOpenOrder[]
): PositionTriggers => {
  const { takeProfit, stopLoss } = extractPositionTriggerOrders(coin, orders)
  return {
    takeProfit: takeProfit?.triggerPx ?? 0,
    stopLoss: stopLoss?.triggerPx ?? 0
  }
}

const statusOfSigned = (value: number): PriceChangeStatus => {
  if (value > 0) {
    return PriceChangeStatus.Up
  }
  if (value < 0) {
    return PriceChangeStatus.Down
  }
  return PriceChangeStatus.Neutral
}

/**
 * Map a Hyperliquid clearinghouse `AssetPosition` onto the upstream
 * {@link Position} view model. Mark price is derived from the position's
 * notional value and signed size (Hyperliquid does not return a per-position
 * mark price on the clearinghouse row).
 */
export const toPosition = (
  assetPosition: AssetPosition,
  orders: readonly AnyOpenOrder[] = []
): Position => {
  const { position } = assetPosition
  const szi = toNumber(position.szi)
  const size = Math.abs(szi)
  const side: PositionSide = szi >= 0 ? 'long' : 'short'
  const entryPrice = toNumber(position.entryPx)
  const positionValue = Math.abs(toNumber(position.positionValue))
  const markPrice = size > 0 ? positionValue / size : entryPrice
  const pnl = toNumber(position.unrealizedPnl)
  const liquidationPrice =
    position.liquidationPx !== undefined
      ? toNumber(position.liquidationPx)
      : undefined
  const liquidationDistance =
    liquidationPrice !== undefined && markPrice > 0
      ? ((liquidationPrice - markPrice) / markPrice) * 100
      : undefined

  const { takeProfit, stopLoss } = extractPositionTriggers(
    position.coin,
    orders
  )

  return {
    id: position.coin,
    symbol: tickerOfCoin(position.coin),
    side,
    leverage: position.leverage.value,
    marginMode: position.leverage.type,
    size,
    price: markPrice,
    pnl,
    pnlStatus: statusOfSigned(pnl),
    takeProfit,
    stopLoss,
    liquidationPrice,
    liquidationDistance,
    markPrice,
    entryPrice
  }
}

/**
 * All open positions mapped to the upstream {@link Position} view model. Pass
 * the account's open orders so each position's TP/SL trigger prices are filled
 * in (they live in the open-orders feed, not the clearinghouse position).
 */
export const toPositions = (
  positions: readonly AssetPosition[],
  orders: readonly AnyOpenOrder[] = []
): Position[] => positions.map(position => toPosition(position, orders))

/**
 * Aggregate open positions into the upstream {@link PositionsSummary}. `pnl` is
 * total unrealized P&L; `changePercent` is that P&L as a percentage of margin in
 * use (return on margin), since Hyperliquid's clearinghouse state has no direct
 * "24h account change" figure.
 *
 * Takes the already-merged positions array (main-dex + HIP-3) so the summary
 * reflects builder-dex positions too.
 */
export const toPositionsSummary = (
  positions: readonly AssetPosition[]
): PositionsSummary => {
  let totalPnl = 0
  let totalMargin = 0
  for (const { position } of positions) {
    totalPnl += toNumber(position.unrealizedPnl)
    totalMargin += toNumber(position.marginUsed)
  }
  const changePercent =
    totalMargin > 0 ? Math.abs((totalPnl / totalMargin) * 100) : 0

  return {
    openPositions: positions.length,
    changePercent,
    changeStatus: statusOfSigned(totalPnl),
    pnl: totalPnl,
    pnlStatus: statusOfSigned(totalPnl)
  }
}

const sideOfFill = (fill: UserFill): PositionSide => {
  if (fill.dir.toLowerCase().includes('short')) {
    return 'short'
  }
  if (fill.dir.toLowerCase().includes('long')) {
    return 'long'
  }
  // Fall back to the raw taker side: "B" = buy = long.
  return fill.side === 'A' ? 'short' : 'long'
}

/**
 * Map a Hyperliquid `UserFill` onto the upstream {@link PositionEntry} history
 * row. `size` is expressed in quote currency (fill size × price); realised P&L
 * is only surfaced when the fill actually closed something.
 */
export const toPositionEntry = (fill: UserFill): PositionEntry => {
  const px = toNumber(fill.px)
  const sz = toNumber(fill.sz)
  const closedPnl = toNumber(fill.closedPnl)
  const hasPnl = closedPnl !== 0
  const date = new Date(fill.time)

  return {
    id: `${fill.hash}-${fill.tid ?? fill.oid}`,
    coin: fill.coin,
    symbol: tickerOfCoin(fill.coin),
    side: sideOfFill(fill),
    outcome: fill.dir,
    size: sz * px,
    avgPrice: px,
    pnl: hasPnl ? closedPnl : undefined,
    pnlStatus: hasPnl ? statusOfSigned(closedPnl) : undefined,
    dateLabel: date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    }),
    timeLabel: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }
}

/** All fills mapped to the upstream {@link PositionEntry} history rows. */
export const toPositionEntries = (
  fills: readonly UserFill[]
): PositionEntry[] => fills.map(toPositionEntry)
