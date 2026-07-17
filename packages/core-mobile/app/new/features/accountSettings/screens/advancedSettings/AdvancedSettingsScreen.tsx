import { View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React from 'react'
import { FilterSmallUtxos } from './components/FilterSmallUtxos'
import { QuickSwaps } from './components/QuickSwaps'

export const AdvancedSettingsScreen = (): React.JSX.Element | null => {
  return (
    <ScrollScreen
      title="Advanced settings"
      subtitle="Tools and settings for power users"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ marginTop: 24, gap: 24 }}>
        <FilterSmallUtxos />
        <QuickSwaps />
      </View>
    </ScrollScreen>
  )
}
