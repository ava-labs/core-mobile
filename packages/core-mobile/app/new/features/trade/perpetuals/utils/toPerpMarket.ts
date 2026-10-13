import { type PerpsAssetCtx } from '@avalabs/perps-sdk'
import { PerpMarketData } from '../types'
import { changeStatusOf, dayChangeFraction, toNumber } from './format'

/**
 * Flatten a Hyperliquid live asset context into the {@link PerpMarketData}
 * model. Shared by the native universe and the per-dex HIP-3 universes so both
 * produce identical shapes (only `symbol` / `dex` differ between the sources).
 */
export const toPerpMarket = (
  ctx: PerpsAssetCtx | undefined,
  { symbol, dex }: { symbol: string; dex: string }
): PerpMarketData => {
  const price = toNumber(ctx?.markPx)
  const prevDayPx = toNumber(ctx?.prevDayPx)
  const change = dayChangeFraction(price, prevDayPx)
  return {
    symbol,
    dex,
    price,
    changePercent: change,
    changeStatus: changeStatusOf(change),
    volume: toNumber(ctx?.dayNtlVlm)
  }
}
