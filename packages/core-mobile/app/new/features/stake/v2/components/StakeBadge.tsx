import { alpha, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import React, { ReactNode } from 'react'

export type StakeBadgeType = 'fastStake' | 'delegating' | 'validating'

interface StakeBadgeProps {
  type: StakeBadgeType
}

interface BadgeConfig {
  label: string
  renderIcon?: (color: string) => ReactNode
}

const BADGES: Record<StakeBadgeType, BadgeConfig> = {
  fastStake: {
    label: 'Fast stake',
    renderIcon: color => <Icons.Custom.ElectricBolt color={color} />
  },
  // Noun-form labels, matching web's stake-table type column ("Delegation" /
  // "Validation" regardless of active vs completed).
  delegating: {
    label: 'Delegation'
  },
  validating: {
    label: 'Validation'
  }
}

/**
 * Pill-style label rendered on V2 stake cards.
 *
 * Visual spec (Figma):
 * - background: `$textPrimary` @ 10% (auto-adapts to dark mode)
 * - text:       `$textPrimary` in Inter-Medium 11px
 * - optional leading icon for kinds that have one (e.g. fastStake)
 */
export const StakeBadge = ({ type }: StakeBadgeProps): JSX.Element => {
  const { theme } = useTheme()
  const { label, renderIcon } = BADGES[type]

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
      {renderIcon?.(theme.colors.$textPrimary)}
      <Text
        variant="caption"
        sx={{ color: theme.colors.$textPrimary, fontFamily: 'Inter-Medium' }}>
        {label}
      </Text>
    </View>
  )
}
