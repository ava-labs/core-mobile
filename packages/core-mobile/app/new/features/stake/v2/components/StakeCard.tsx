import {
  BaseCard,
  Motion,
  Separator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useState } from 'react'
import { LayoutChangeEvent, Platform, StyleSheet } from 'react-native'
import { ProgressWave } from './ProgressWave'
import { StakeBadge, StakeBadgeKind } from './StakeBadge'

export type StakeCardVariant = 'active' | 'completed'

export interface StakeCardProps {
  /** Pre-formatted reward heading, e.g. "1.75 AVAX reward unlocked in 17 days" */
  title: string
  variant: StakeCardVariant
  /** Pre-formatted staked amount, e.g. "36.50 AVAX" */
  stakedAmount: string
  /** Pre-formatted staked USD value, e.g. "$327.64 USD" */
  stakedUsdValue: string
  /** Pre-truncated node identifier, e.g. "NodeID...0b3Lg" */
  nodeId: string
  /** Pre-formatted end date, e.g. "01/06/2026" */
  endDate: string
  /** 0..1 staking progress. Only used for variant='active' to drive the wave fill. */
  progress?: number
  /** Optional accelerometer motion driver for the wave animation. */
  motion?: Motion
  /** Optional badge label shown only on active cards (fastStake / delegating / validating). */
  badge?: StakeBadgeKind
  width?: number
  onPress?: () => void
}

const DEFAULT_WIDTH = 200

export const StakeCard = ({
  title,
  variant,
  stakedAmount,
  stakedUsdValue,
  nodeId,
  endDate,
  progress,
  motion,
  badge,
  width = DEFAULT_WIDTH,
  onPress
}: StakeCardProps): JSX.Element => {
  const { theme } = useTheme()
  const isCompleted = variant === 'completed'
  const showWave = !isCompleted && progress !== undefined

  const [waveSize, setWaveSize] = useState({ width: 0, height: 0 })

  const handleWaveLayout = (e: LayoutChangeEvent): void => {
    const { width: w, height: h } = e.nativeEvent.layout
    if (w !== waveSize.width || h !== waveSize.height) {
      setWaveSize({ width: w, height: h })
    }
  }

  return (
    <BaseCard
      onPress={onPress}
      sx={{
        width,
        paddingTop: 20,
        paddingHorizontal: 18,
        paddingBottom: 16
      }}>
      {showWave && (
        <View
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
          onLayout={handleWaveLayout}>
          <ProgressWave
            width={waveSize.width}
            height={waveSize.height}
            progress={progress}
            motion={motion}
          />
        </View>
      )}
      <View sx={{ gap: 8, alignItems: 'flex-start' }}>
        <Text
          sx={{
            fontFamily: 'Aeonik-Bold',
            fontSize: 24,
            lineHeight: Platform.OS === 'ios' ? 22 : 24,
            color: isCompleted ? '$textSuccess' : '$textPrimary'
          }}>
          {title}
        </Text>
        {!isCompleted && badge && <StakeBadge kind={badge} />}
      </View>

      <View sx={{ marginTop: 18, gap: 1 }}>
        <Text
          variant="caption"
          sx={{ color: '$textPrimary', fontFamily: 'Inter-Medium' }}>
          {stakedAmount} staked
        </Text>
        <Text
          variant="caption"
          sx={{
            color: '$textSecondary',
            fontFamily: 'Inter-Medium',
            fontSize: 10
          }}>
          {stakedUsdValue}
        </Text>
      </View>

      <Separator sx={{ marginTop: 4, marginBottom: 6 }} />
      <DetailRow
        label="Node"
        value={
          <Text variant="mono" sx={{ color: '$textSecondary' }}>
            {nodeId}
          </Text>
        }
      />
      <Separator sx={{ marginTop: 5, marginBottom: 6 }} />
      <DetailRow
        label={isCompleted ? 'Ended on' : 'Locked until'}
        value={endDate}
      />
      <Separator sx={{ marginTop: 5, marginBottom: 6 }} />
      <DetailRow
        label="Status"
        value={
          isCompleted ? (
            'Completed'
          ) : (
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.colors.$textSuccess
                }}
              />
              <Text
                variant="caption"
                sx={{
                  color: '$textSecondary',
                  fontFamily: 'Inter-Medium'
                }}>
                Active
              </Text>
            </View>
          )
        }
      />
    </BaseCard>
  )
}

const DetailRow = ({
  label,
  value
}: {
  label: string
  value: string | React.ReactNode
}): JSX.Element => {
  return (
    <View
      sx={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
      <Text
        variant="caption"
        sx={{ color: '$textPrimary', fontFamily: 'Inter-Medium' }}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text
          variant="caption"
          sx={{ color: '$textSecondary', fontFamily: 'Inter-Medium' }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  )
}
