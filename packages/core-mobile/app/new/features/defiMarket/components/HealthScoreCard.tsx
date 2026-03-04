import React from 'react'
import { Card, Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  formatHealthScore,
  getHealthRisk,
  getHealthRiskColor
} from '../utils/healthRisk'

export const HealthScoreCard = ({
  score
}: {
  score: number | undefined
}): JSX.Element => {
  const { theme } = useTheme()

  const color =
    score === undefined || Number.isNaN(score)
      ? theme.colors.$textSecondary
      : getHealthRiskColor({
          risk: getHealthRisk(score),
          colors: theme.colors
        })

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
          <Text
            variant="body1"
            sx={{
              color,
              fontWeight: 500
            }}>
            {formatHealthScore(score, 2)}
          </Text>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Liquidation at {'<'}1.0
          </Text>
        </View>
      </View>
    </Card>
  )
}
