import { HEALTH_SCORE_CAUTION_COLOR } from '../consts'

export enum HealthRisk {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high'
}

// Unified thresholds for all protocols
const HIGH_THRESHOLD = 1.25
const LOW_THRESHOLD = 3

export const getHealthRisk = (score: number): HealthRisk => {
  if (score < HIGH_THRESHOLD) {
    return HealthRisk.HIGH
  }
  if (score <= LOW_THRESHOLD) {
    return HealthRisk.MODERATE
  }
  return HealthRisk.LOW
}

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
