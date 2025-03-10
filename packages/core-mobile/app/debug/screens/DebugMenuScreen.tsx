import React from 'react'
import { ScrollView } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { DebugStackParamList } from 'debug/navigation/DebugStack'
import AppNavigation from 'navigation/AppNavigation'

type DebugNavigationProp = StackNavigationProp<DebugStackParamList>

export default function DebugMenuScreen(): React.JSX.Element {
  const { theme } = useApplicationContext()
  const navigation = useNavigation<DebugNavigationProp>()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colorBg1 }}>
      <AvaListItem.Base
        title="Device Information"
        titleAlignment="flex-start"
        showNavigationArrow
        onPress={() => navigation.navigate(AppNavigation.Debug.DeviceInfo)}
        testID="debug_menu__device_info"
      />
      <AvaListItem.Base
        title="POW Benchmark"
        titleAlignment="flex-start"
        showNavigationArrow
        onPress={() => navigation.navigate(AppNavigation.Debug.PowBenchmark)}
        testID="debug_menu__pow_benchmark"
      />
      {/* Add more debug menu items here */}
    </ScrollView>
  )
}
