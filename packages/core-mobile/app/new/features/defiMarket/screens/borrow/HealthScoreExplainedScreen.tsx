import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import {
  formatHealthScore,
  getHealthRiskColor,
  getHealthRisk,
  HealthRisk
} from '../../utils/healthRisk'

export const HealthScoreExplainedScreen = (): JSX.Element | null => {
  const router = useRouter()
  const { theme } = useTheme()
  const { healthScore } = useLocalSearchParams<{
    healthScore?: string
  }>()

  const parsedHealthScore = useMemo(() => {
    const score = Number(healthScore)
    if (!Number.isFinite(score)) {
      return undefined
    }
    return score
  }, [healthScore])

  const healthRisk = useMemo((): HealthRisk => {
    if (parsedHealthScore === undefined) {
      return HealthRisk.LOW
    }
    return getHealthRisk(parsedHealthScore)
  }, [parsedHealthScore])

  const riskLabel = useMemo(() => {
    if (healthRisk === HealthRisk.HIGH) {
      return 'high risk'
    }
    if (healthRisk === HealthRisk.MODERATE) {
      return 'moderate risk'
    }
    return 'low risk'
  }, [healthRisk])

  const ringColor = useMemo(() => {
    return getHealthRiskColor({
      risk: healthRisk,
      colors: theme.colors
    })
  }, [healthRisk, theme.colors])

  const formattedHealthScore = useMemo(() => {
    return formatHealthScore(parsedHealthScore)
  }, [parsedHealthScore])

  const handleDone = useCallback(() => {
    router.back()
  }, [router])

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={handleDone}>
        Done
      </Button>
    )
  }, [handleDone])

  return (
    <ScrollScreen
      isModal
      showNavigationHeaderTitle={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 16
      }}
      renderFooter={renderFooter}>
      <View sx={{ flex: 1 }}>
        <View sx={{ alignItems: 'center', marginTop: 34, marginBottom: 28 }}>
          <View
            sx={{
              width: 106,
              height: 106,
              borderRadius: 53,
              borderWidth: 8,
              borderColor: ringColor,
              backgroundColor: '$surfacePrimary',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Text variant="heading2" sx={{ color: '$textPrimary' }}>
              {formattedHealthScore}
            </Text>
          </View>

          <Text
            variant="heading3"
            sx={{
              marginTop: 24,
              textAlign: 'center',
              maxWidth: 340
            }}>
            Your health score is currently rated as {riskLabel}
          </Text>
        </View>

        <View sx={{ gap: 12 }}>
          <View
            sx={{
              borderRadius: 12,
              backgroundColor: '$surfaceSecondary',
              padding: 16,
              gap: 6
            }}>
            <Text
              variant="body1"
              sx={{ color: '$textPrimary', fontWeight: 500 }}>
              What's a health score?
            </Text>
            <Text variant="body2" sx={{ color: '$textSecondary' }}>
              The health score shows the safety of your deposited collateral
              against the borrowed assets and their underlying value.
            </Text>
          </View>

          <View
            sx={{
              borderRadius: 12,
              backgroundColor: '$surfaceSecondary',
              padding: 16,
              gap: 6
            }}>
            <Text
              variant="body1"
              sx={{ color: '$textPrimary', fontWeight: 500 }}>
              How to read my score?
            </Text>
            <Text variant="body2" sx={{ color: '$textSecondary' }}>
              If the health score goes below 1 your collateral may be liquidated
              by the protocol. Health scores above 1 are not at risk of
              liquidation. Improve your health score by adding collateral or
              repaying open loans.
            </Text>
          </View>
        </View>
      </View>
    </ScrollScreen>
  )
}
