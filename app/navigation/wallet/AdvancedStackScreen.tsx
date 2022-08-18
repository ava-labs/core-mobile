import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions, SubHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import Advanced from 'screens/drawer/advanced/Advanced'
import DappManualConnection from 'screens/drawer/advanced/DAppManualConnection'

export type AdvancedStackParamList = {
  [AppNavigation.Advanced.Advanced]: undefined
  [AppNavigation.Advanced.DappConnectModal]: undefined
}

const AdvancedStack = createStackNavigator<AdvancedStackParamList>()

const AdvancedStackScreen = () => {
  return (
    <AdvancedStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false
      }}>
      <AdvancedStack.Screen
        options={MainHeaderOptions('Advanced')}
        name={AppNavigation.Advanced.Advanced}
        component={Advanced}
      />
      <AdvancedStack.Group screenOptions={{ presentation: 'modal' }}>
        <AdvancedStack.Screen
          options={SubHeaderOptions('Connect to dapp')}
          name={AppNavigation.Advanced.DappConnectModal}
          component={DappManualConnection}
        />
      </AdvancedStack.Group>
    </AdvancedStack.Navigator>
  )
}

export default AdvancedStackScreen
