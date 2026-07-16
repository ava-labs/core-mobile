import { Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React from 'react'
import { FilterSmallUtxos } from './components/FilterSmallUtxos'
import { QuickSwaps } from './components/QuickSwaps'

export const AdvancedSettingsScreen = (): React.JSX.Element | null => {
  return (
    <ScrollScreen
      navigationTitle="Advanced settings"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <Text variant="heading2">Advanced settings</Text>
      <Text variant="subtitle1">Tools and settings for power users</Text>
      <View sx={{ marginTop: 36, gap: 24 }}>
        <FilterSmallUtxos />
        <QuickSwaps />
      </View>
    </ScrollScreen>
  )
}
