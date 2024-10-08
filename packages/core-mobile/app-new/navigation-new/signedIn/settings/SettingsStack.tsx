import { createStackNavigator } from '@react-navigation/stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'navigation-new/utils/screenOptions'
import React from 'react'
import SettingAccountScreen from 'settings/screens/SettingAccountScreen'
import SettingsScreen from 'settings/screens/SettingsScreen'

const Stack = createStackNavigator<SettingsStackParamList>()

const SettingsStack = (): JSX.Element => {
  return (
    <Stack.Navigator screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen
        name="SettingsScreen"
        options={modalFirstScreenOptions}
        component={SettingsScreen}
      />
      <Stack.Screen
        name="SettingAccountScreen"
        component={SettingAccountScreen}
      />
    </Stack.Navigator>
  )
}

export type SettingsStackParamList = {
  SettingsScreen: undefined
  SettingAccountScreen: undefined
}

export default SettingsStack
