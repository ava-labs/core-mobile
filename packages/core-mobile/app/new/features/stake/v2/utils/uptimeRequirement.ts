import { REWARD_UPTIME_REQUIREMENT_PERCENT } from '../constants'

// Protocol is 80% pre-Helicon / 90% post-Helicon; product chose a flat 90% (CP-15098).
export const MIN_UPTIME_FOR_REWARDS = REWARD_UPTIME_REQUIREMENT_PERCENT

export const parseUptime = (
  uptime: string | number | undefined
): number | undefined => {
  // Partial RPC/Glacier payloads can carry null at runtime, and Number(null) is 0.
  if (uptime == null) return undefined
  if (typeof uptime !== 'string' && typeof uptime !== 'number') return undefined
  if (typeof uptime === 'string' && uptime.trim() === '') return undefined
  const value = Number(uptime)
  return Number.isFinite(value) ? value : undefined
}

export const isUptimeBelowRequirement = (
  uptime: string | number | undefined
): boolean => {
  const value = parseUptime(uptime)
  return value !== undefined && value < MIN_UPTIME_FOR_REWARDS
}

export type UptimeColor = '$textSuccess' | '$textDanger'

// List only: Figma keeps healthy uptime neutral on node details and review.
export const getUptimeColor = (
  uptime: string | number | undefined
): UptimeColor | undefined => {
  const value = parseUptime(uptime)
  if (value === undefined) return undefined
  return value < MIN_UPTIME_FOR_REWARDS ? '$textDanger' : '$textSuccess'
}
