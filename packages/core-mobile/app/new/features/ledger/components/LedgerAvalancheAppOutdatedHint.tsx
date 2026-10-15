import { Icons, SxProp, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { useOutdatedLedgerAvalancheAppVersions } from '../hooks/useOutdatedLedgerAvalancheAppVersions'

export const LedgerAvalancheAppOutdatedHint = ({
  sx
}: {
  sx?: SxProp
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const outdatedVersions = useOutdatedLedgerAvalancheAppVersions()

  if (!outdatedVersions) return null

  return (
    <View
      testID="ledger_avalanche_app_outdated_hint"
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '$surfaceSecondary',
        ...sx
      }}>
      <Icons.Alert.AlertCircle
        color={colors.$textPrimary}
        width={20}
        height={20}
      />
      <Text variant="body2" sx={{ flex: 1, color: '$textSecondary' }}>
        For improved user experience, update your Avalanche app on Ledger (
        <Text variant="body2" sx={{ color: '$textDanger' }}>
          {outdatedVersions.currentVersion}
        </Text>
        {' → '}
        <Text variant="body2" sx={{ color: '$textSuccess' }}>
          {outdatedVersions.recommendedVersion}
        </Text>
        ).
      </Text>
    </View>
  )
}
