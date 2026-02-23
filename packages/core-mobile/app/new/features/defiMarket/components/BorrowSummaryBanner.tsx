import {
  Icons,
  MaskedText,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'
import { GestureResponderEvent } from 'react-native'
import { useSelector } from 'react-redux'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { HEALTH_SCORE_CAUTION_COLOR } from '../consts'
import { BorrowSummary } from '../hooks/useBorrowPositionsSummary'
import { MarketName } from '../types'
import { DefiMarketLogo } from './DefiMarketLogo'

const HEALTH_SCORE_BADGE_SIZE = 30
const HEALTH_SCORE_BADGE_BORDER_WIDTH = 3
const HEALTH_SCORE_BADGE_ICON_GAP = 8
const HEALTH_SCORE_BADGE_OVERLAP = HEALTH_SCORE_BADGE_BORDER_WIDTH

export const BorrowSummaryBanner = ({
  summary,
  protocol,
  onHealthScorePress
}: {
  summary: BorrowSummary
  protocol?: MarketName
  onHealthScorePress?: (event: GestureResponderEvent) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  const formattedNetWorth = useMemo(() => {
    return formatCurrency({ amount: summary.netWorthUsd })
  }, [formatCurrency, summary.netWorthUsd])

  const formattedNetApy = useMemo(() => {
    // Truncate to 2 decimal places (don't round up to avoid overstating APY)
    const truncated = Math.trunc(summary.netApyPercent * 100) / 100
    return `${truncated.toFixed(2)}%`
  }, [summary.netApyPercent])

  const formattedBorrowPowerUsed = useMemo(() => {
    const formatted = summary.borrowPowerUsedPercent
      .toFixed(2)
      .replace(/\.?0+$/, '')
    return `${formatted}%`
  }, [summary.borrowPowerUsedPercent])

  const metrics = useMemo(
    () => [
      {
        label: 'Net worth',
        value: formattedNetWorth,
        maskWidth: 65
      },
      {
        label: 'Net APY',
        value: formattedNetApy,
        maskWidth: 55
      },
      {
        label: 'Borrow power used',
        value: formattedBorrowPowerUsed,
        maskWidth: 50
      }
    ],
    [formattedBorrowPowerUsed, formattedNetApy, formattedNetWorth]
  )

  const healthScoreRingColor = useMemo(() => {
    if (summary.healthRiskLabel === 'high risk') {
      return theme.colors.$textDanger
    }
    if (summary.healthRiskLabel === 'moderate risk') {
      return HEALTH_SCORE_CAUTION_COLOR
    }
    return theme.colors.$textSuccess
  }, [
    summary.healthRiskLabel,
    theme.colors.$textDanger,
    theme.colors.$textSuccess
  ])

  const healthScoreBadgeText = useMemo(() => {
    const score = summary.healthScore

    if (score === undefined || Number.isNaN(score)) {
      return '--'
    }

    if (!Number.isFinite(score)) {
      return '∞'
    }

    // Keep the badge text compact so it stays centered in the 30x30 circle.
    if (score >= 10) {
      return score.toFixed(0)
    }

    return score.toFixed(1)
  }, [summary.healthScore])

  return (
    <View
      sx={{
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '$surfaceSecondary'
      }}>
      <View
        sx={{
          flexDirection: 'row',
          gap: 12
        }}>
        {metrics.map((item, index) => (
          <View key={item.label} sx={{ flex: index === 2 ? 0.8 : 0.5, gap: 0 }}>
            <MaskedText
              variant="heading5"
              shouldMask={isPrivacyModeEnabled}
              maskWidth={item.maskWidth}>
              {item.value}
            </MaskedText>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {summary.healthScore !== undefined && (
        <>
          <Separator sx={{ marginVertical: 12 }} />
          <TouchableOpacity
            onPress={onHealthScorePress}
            disabled={!onHealthScorePress}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: HEALTH_SCORE_BADGE_ICON_GAP,
                  flex: 1
                }}>
                {protocol && (
                  <View sx={{ zIndex: 2 }}>
                    <DefiMarketLogo
                      marketName={protocol}
                      width={HEALTH_SCORE_BADGE_SIZE}
                    />
                  </View>
                )}
                <View
                  sx={{
                    marginLeft: protocol
                      ? -(
                          HEALTH_SCORE_BADGE_ICON_GAP +
                          HEALTH_SCORE_BADGE_OVERLAP
                        )
                      : 0,
                    width: HEALTH_SCORE_BADGE_SIZE,
                    height: HEALTH_SCORE_BADGE_SIZE,
                    borderRadius: HEALTH_SCORE_BADGE_SIZE / 2,
                    backgroundColor: 'transparent',
                    borderWidth: HEALTH_SCORE_BADGE_BORDER_WIDTH,
                    borderColor: healthScoreRingColor,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <Text
                    variant="caption"
                    sx={{
                      width: '100%',
                      textAlign: 'center'
                    }}>
                    {healthScoreBadgeText}
                  </Text>
                </View>
                <View
                  sx={{
                    flex: 1,
                    justifyContent: 'center'
                  }}>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary'
                    }}>
                    Your health score is currently rated as{' '}
                    {summary.healthRiskLabel}
                  </Text>
                </View>
              </View>
              <Icons.Navigation.ChevronRight
                width={20}
                height={20}
                color={theme.colors.$textSecondary}
              />
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}
