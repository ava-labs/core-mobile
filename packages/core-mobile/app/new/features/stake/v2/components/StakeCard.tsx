import {
  alpha,
  BaseCard,
  Separator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'

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
  width = DEFAULT_WIDTH,
  onPress
}: StakeCardProps): JSX.Element => {
  const { theme } = useTheme()
  const isCompleted = variant === 'completed'

  return (
    <BaseCard
      onPress={onPress}
      sx={{
        width,
        paddingVertical: 20,
        paddingHorizontal: 18
      }}>
      <View sx={{ gap: 10, alignItems: 'flex-start' }}>
        <Text
          sx={{
            fontFamily: 'Aeonik-Bold',
            fontSize: 24,
            lineHeight: Platform.OS === 'ios' ? 22 : 24,
            color: isCompleted ? '$textSuccess' : '$textPrimary'
          }}>
          {title}
        </Text>
        {!isCompleted && <FastStakeBadge />}
      </View>

      <View sx={{ marginTop: 24, gap: 1 }}>
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

      <Separator sx={{ marginTop: 7, marginBottom: 7 }} />
      <DetailRow
        label="Node"
        value={
          <Text variant="mono" sx={{ color: '$textSecondary' }}>
            {nodeId}
          </Text>
        }
      />
      <Separator sx={{ marginVertical: 7 }} />
      <DetailRow
        label={isCompleted ? 'Ended on' : 'Locked until'}
        value={endDate}
      />
      <Separator sx={{ marginVertical: 7 }} />
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

const FastStakeBadge = (): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        // 10% of $textPrimary — semi-transparent so the wave animation
        // behind the card can show through. Adapts to light/dark automatically:
        //   light: rgba(40,40,46,0.1)   (neutral-850 @ 10%)
        //   dark:  rgba(255,255,255,0.1) (white @ 10%)
        backgroundColor: alpha(theme.colors.$textPrimary, 0.1)
      }}>
      <Text sx={{ fontSize: 11 }}>⚡</Text>
      <Text variant="buttonSmall" sx={{ color: theme.colors.$textPrimary }}>
        Fast stake
      </Text>
    </View>
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
