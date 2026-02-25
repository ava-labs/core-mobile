import { HEALTH_SCORE_CAUTION_COLOR } from '../consts'

export enum HealthRisk {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high'
}

/**
 * Health Score thresholds for DeFi lending protocols.
 *
 * Health Score = Total Collateral Value × Liquidation Threshold / Total Borrowed Value
 *
 * - Score < 1.25: HIGH risk - Position is close to liquidation
 * - Score 1.25-3.0: MODERATE risk - Position needs monitoring
 * - Score > 3.0: LOW risk - Position is healthy
 *
 * When Health Score reaches 1.0, the position becomes eligible for liquidation.
 */
const HIGH_THRESHOLD = 1.25
const LOW_THRESHOLD = 3

/**
 * Determines the risk level based on the health score.
 */
export const getHealthRisk = (score: number): HealthRisk => {
  if (score < HIGH_THRESHOLD) {
    return HealthRisk.HIGH
  }
  if (score <= LOW_THRESHOLD) {
    return HealthRisk.MODERATE
  }
  return HealthRisk.LOW
}

/**
 * Returns the appropriate color for displaying the health risk level.
 */
export const getHealthRiskColor = ({
  risk,
  colors
}: {
  risk: HealthRisk
  colors: {
    $textDanger: string
    $textSuccess: string
  }
}): string => {
  if (risk === HealthRisk.HIGH) {
    return colors.$textDanger
  }
  if (risk === HealthRisk.MODERATE) {
    return HEALTH_SCORE_CAUTION_COLOR
  }
  return colors.$textSuccess
}

/**
 * Formats the health score for display.
 * - undefined/NaN: '--'
 * - Infinity: '∞' (no borrows means infinite health)
 * - >= 100: Rounded integer
 * - < 100: One decimal place
 */
export const formatHealthScore = (score: number | undefined): string => {
  if (score === undefined || Number.isNaN(score)) {
    return '--'
  }
  if (!Number.isFinite(score)) {
    return '∞'
  }
  if (score >= 100) {
    return Math.round(score).toString()
  }
  return score.toFixed(1)
}
