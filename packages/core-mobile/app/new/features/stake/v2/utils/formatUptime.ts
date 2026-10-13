import { formatNumber } from 'utils/formatNumber/formatNumber'

/**
 * Formats a validator uptime percentage for display. Values below 100 are
 * truncated (not rounded) to 2 decimals so a 99.999%-uptime node never reads
 * as "100" — only an exact 100 renders (without decimals). `formatNumber`
 * alone rounds, which showed "100.00%" for near-perfect uptimes.
 */
export const formatUptime = (uptime: string | number): string => {
  const n = Number(uptime)
  if (!Number.isFinite(n)) return formatNumber(uptime)
  if (n === 100) return '100'
  return formatNumber(Math.floor(n * 100) / 100)
}
