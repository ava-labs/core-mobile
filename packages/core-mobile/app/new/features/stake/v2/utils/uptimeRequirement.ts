import { REWARD_UPTIME_REQUIREMENT_PERCENT } from '../constants'

/**
 * Minimum validator uptime (percent, 0-100) for delegators to be paid.
 * P-Chain rewards are all-or-nothing: below this at the end of the period,
 * nobody is paid. The protocol is 90% post-Helicon and 80% pre-Helicon;
 * product chose a flat 90% for every node (CP-15098). Aliases the existing
 * ACP-267 constant that Fast Stake's downtime-budget ranking already uses
 * (`selectFastStakeValidator`), so there is one 90 in the stake feature.
 */
export const MIN_UPTIME_FOR_REWARDS = REWARD_UPTIME_REQUIREMENT_PERCENT

/**
 * Parses a validator uptime from either source (PVM `uptime` string or
 * Glacier `uptimePerformance` number; both already 0-100). Returns
 * `undefined` for missing, blank, or non-finite input so callers never
 * treat absent data as 0%.
 */
export const parseUptime = (
  uptime: string | number | undefined
): number | undefined => {
  // Runtime guard: partial RPC/Glacier payloads can carry null or other types
  // that TypeScript does not catch, and Number(null) would be 0.
  if (uptime == null) return undefined
  if (typeof uptime !== 'string' && typeof uptime !== 'number') return undefined
  if (typeof uptime === 'string' && uptime.trim() === '') return undefined
  const value = Number(uptime)
  return Number.isFinite(value) ? value : undefined
}

/** True only when uptime is known and strictly below the threshold. */
export const isUptimeBelowRequirement = (
  uptime: string | number | undefined
): boolean => {
  const value = parseUptime(uptime)
  return value !== undefined && value < MIN_UPTIME_FOR_REWARDS
}

export type UptimeColor = '$textSuccess' | '$textDanger'

/**
 * Node-list uptime colour (Figma "Select a node"): success at or above the
 * threshold, danger below, `undefined` when uptime is missing or unparsable.
 * List only: Figma keeps healthy uptime neutral on node details and review.
 */
export const getUptimeColor = (
  uptime: string | number | undefined
): UptimeColor | undefined => {
  const value = parseUptime(uptime)
  if (value === undefined) return undefined
  return value < MIN_UPTIME_FOR_REWARDS ? '$textDanger' : '$textSuccess'
}
