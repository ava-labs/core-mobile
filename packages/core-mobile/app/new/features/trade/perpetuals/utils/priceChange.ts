import { PriceChangeStatus } from '@avalabs/k2-alpine'
import type { PerpsAssetCtx } from '@avalabs/perps-sdk'

export interface PriceChange {
  markPx?: number
  prevDayPx?: number
  delta?: number
  pct?: number
  status: PriceChangeStatus
}

const parseNum = (s: string | undefined): number | undefined => {
  if (s === undefined) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const statusFor = (pct: number | undefined): PriceChangeStatus => {
  if (pct === undefined) return PriceChangeStatus.Neutral
  if (pct > 0) return PriceChangeStatus.Up
  if (pct < 0) return PriceChangeStatus.Down
  return PriceChangeStatus.Neutral
}

export const computePriceChange = (
  assetCtx: PerpsAssetCtx | undefined
): PriceChange => {
  const markPx = parseNum(assetCtx?.markPx)
  const prevDayPx = parseNum(assetCtx?.prevDayPx)
  const delta =
    markPx !== undefined && prevDayPx !== undefined
      ? markPx - prevDayPx
      : undefined
  const pct =
    markPx !== undefined && prevDayPx !== undefined && prevDayPx !== 0
      ? ((markPx - prevDayPx) / prevDayPx) * 100
      : undefined
  return { markPx, prevDayPx, delta, pct, status: statusFor(pct) }
}

export const formatPercent = (pct: number | undefined): string | undefined =>
  pct === undefined ? undefined : `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`

export const formatChangeRow = (
  delta: number | undefined,
  pct: number | undefined
): string | undefined => {
  if (delta === undefined || pct === undefined) return undefined
  return `${delta > 0 ? '+' : ''}${delta.toFixed(2)} / ${
    pct > 0 ? '+' : ''
  }${pct.toFixed(2)}%`
}
