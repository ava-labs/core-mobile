import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import DebugDeviceInfoScreen from 'debug/screens/DebugDeviceInfoScreen'
import DebugMenuScreen from 'debug/screens/DebugMenuScreen'
import DebugPowBenchmarkScreen from 'debug/screens/DebugPowBenchmarkScreen'
import AppNavigation from 'navigation/AppNavigation'

const Stack = createStackNavigator<DebugStackParamList>()

export type DebugStackParamList = {
  [AppNavigation.Debug.Menu]: undefined
  [AppNavigation.Debug.DeviceInfo]: undefined
  [AppNavigation.Debug.PowBenchmark]: undefined
}

export default function DebugStack(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={AppNavigation.Debug.Menu}
        component={DebugMenuScreen}
        options={{ title: 'Debug Menu' }}
      />
      <Stack.Screen
        name={AppNavigation.Debug.DeviceInfo}
        component={DebugDeviceInfoScreen}
        options={{ title: 'Device Info' }}
      />
      <Stack.Screen
        name={AppNavigation.Debug.PowBenchmark}
        component={DebugPowBenchmarkScreen}
        options={{ title: 'POW Benchmark' }}
      />
    </Stack.Navigator>
  )
}
