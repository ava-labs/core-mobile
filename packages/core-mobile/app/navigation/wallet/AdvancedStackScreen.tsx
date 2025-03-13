import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import Advanced from 'screens/drawer/advanced/Advanced'

export type AdvancedStackParamList = {
  [AppNavigation.Advanced.Advanced]: undefined
}

const AdvancedStack = createStackNavigator<AdvancedStackParamList>()

const AdvancedStackScreen = (): JSX.Element => {
  return (
    <AdvancedStack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal'
      }}>
      <AdvancedStack.Screen
        options={MainHeaderOptions({
          title: 'Advanced',
          headerBackTestID: 'header_back'
        })}
        name={AppNavigation.Advanced.Advanced}
        component={Advanced}
      />
    </AdvancedStack.Navigator>
  )
}

export default AdvancedStackScreen
