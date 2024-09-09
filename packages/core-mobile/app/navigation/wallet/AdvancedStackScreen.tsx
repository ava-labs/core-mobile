import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import Advanced from 'screens/drawer/advanced/Advanced'
import { SafeLowerAreaView } from 'components/SafeAreaViews'

export type AdvancedStackParamList = {
  [AppNavigation.Advanced.Advanced]: undefined
}

const AdvancedStack = createStackNavigator<AdvancedStackParamList>()

const AdvancedStackScreen = () => {
  return (
    <SafeLowerAreaView>
      <AdvancedStack.Navigator
        screenOptions={{
          headerBackTitleVisible: false
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
    </SafeLowerAreaView>
  )
}

export default AdvancedStackScreen
