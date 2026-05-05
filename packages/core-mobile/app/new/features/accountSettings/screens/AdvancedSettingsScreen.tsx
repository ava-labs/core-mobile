import React from 'react'
import { Text, View, useTheme } from '@avalabs/k2-alpine'
import { useQuickSwaps } from 'features/swap/hooks/useQuickSwaps'
import { QuickSwapsToggleRow } from '../components/QuickSwapsToggleRow'

export const AdvancedSettingsScreen = (): React.JSX.Element => {
  const { theme } = useTheme()
  const { isAvailable } = useQuickSwaps()

  return (
    <View
      sx={{
        flex: 1,
        backgroundColor: theme.colors.$surfacePrimary,
        paddingHorizontal: 16
      }}>
      <Text
        variant="heading3"
        sx={{ marginTop: 24, color: theme.colors.$textPrimary }}>
        Advanced settings
      </Text>
      <Text
        variant="subtitle1"
        sx={{
          marginTop: 4,
          marginBottom: 24,
          color: theme.colors.$textSecondary
        }}>
        Tools and settings for power users
      </Text>

      {isAvailable && <QuickSwapsToggleRow testID="quick-swaps-toggle-row" />}
    </View>
  )
}
