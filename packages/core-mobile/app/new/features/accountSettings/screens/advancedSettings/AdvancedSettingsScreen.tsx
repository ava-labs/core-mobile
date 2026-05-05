import React from 'react'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useQuickSwaps } from 'features/swap/hooks/useQuickSwaps'
import { Text, View } from '@avalabs/k2-alpine'
import { QuickSwapsToggleRow } from './QuickSwapsToggleRow'

export const AdvancedSettingsScreen = (): React.JSX.Element => {
  const { isAvailable } = useQuickSwaps()

  return (
    <ScrollScreen
      navigationTitle="Advanced settings"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <Text variant="heading2">Advanced settings</Text>
      <Text variant="subtitle1">Tools and settings for power users</Text>
      <View sx={{ gap: 24, marginTop: 36 }}>
        {isAvailable && <QuickSwapsToggleRow testID="quick-swaps-toggle-row" />}
      </View>
    </ScrollScreen>
  )
}
