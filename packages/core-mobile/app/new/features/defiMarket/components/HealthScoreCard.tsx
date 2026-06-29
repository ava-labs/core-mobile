import React from 'react'
import { Card, Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  formatHealthScore,
  getHealthRisk,
  HealthRisk
} from '../utils/healthRisk'

const useScoreColor = (score: number | undefined): string => {
  const { theme } = useTheme()
  if (score === undefined || Number.isNaN(score)) {
    return theme.colors.$textSecondary
  }
  const risk = getHealthRisk(score)
  if (risk === HealthRisk.HIGH) return theme.colors.$textDanger
  if (risk === HealthRisk.LOW) return theme.colors.$textSuccess
  return theme.colors.$textPrimary
}

export const HealthScoreCard = ({
  score,
  currentScore
}: {
  score: number | undefined
  currentScore?: number | undefined
}): JSX.Element => {
  const projectedColor = useScoreColor(score)
  const currentColor = useScoreColor(currentScore)

  const formattedCurrent =
    currentScore !== undefined && !Number.isNaN(currentScore)
      ? formatHealthScore(currentScore, { fractionDigits: 2 })
      : undefined
  const formattedProjected =
    score !== undefined
      ? formatHealthScore(score, { fractionDigits: 2 })
      : undefined

  const showTransition =
    formattedCurrent !== undefined &&
    formattedProjected !== undefined &&
    formattedCurrent !== formattedProjected

  return (
    <Card sx={{ padding: 16 }}>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}>
        <Text variant="body1" sx={{ color: '$textPrimary', flexShrink: 0 }}>
          Health score
        </Text>
        <View sx={{ flex: 1, alignItems: 'flex-end', gap: 2 }}>
          {showTransition ? (
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                variant="body1"
                sx={{ color: currentColor, fontFamily: 'Inter-Medium' }}>
                {formattedCurrent}
              </Text>
              <Text
                variant="body1"
                sx={{ color: '$textSecondary', fontFamily: 'Inter-Medium' }}>
                →
              </Text>
              <Text
                variant="body1"
                sx={{ color: projectedColor, fontFamily: 'Inter-Medium' }}>
                {formattedProjected}
              </Text>
            </View>
          ) : (
            <Text
              variant="body1"
              sx={{ color: projectedColor, fontFamily: 'Inter-Medium' }}>
              {formattedProjected}
            </Text>
          )}
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Liquidation at {'<'}1.0
          </Text>
        </View>
      </View>
    </Card>
  )
}
