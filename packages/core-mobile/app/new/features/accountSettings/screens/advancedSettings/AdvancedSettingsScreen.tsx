import { GroupList, GroupListItem, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { FilterSmallUtxos } from './components/FilterSmallUtxos'
import { QuickSwaps } from './components/QuickSwaps'

export const AdvancedSettingsScreen = (): React.JSX.Element | null => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  // Dev-only QA tools — shown in developer (testnet) mode so they're reachable
  // on internal builds but hidden from normal production users.
  const devTools: GroupListItem[] = [
    {
      title: 'Font sample (i18n QA)',
      onPress: () => navigate('/accountSettings/fontSample')
    }
  ]

  return (
    <ScrollScreen
      title="Advanced settings"
      subtitle="Tools and settings for power users"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ marginTop: 24, gap: 24 }}>
        <FilterSmallUtxos />
        <QuickSwaps />
        {isDeveloperMode && <GroupList data={devTools} />}
      </View>
    </ScrollScreen>
  )
}
