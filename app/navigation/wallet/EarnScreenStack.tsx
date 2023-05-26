import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import StakingDuration from 'screens/earn/DurationScreen'
import EarnTabView from 'screens/earn/EarnTabView'

export type EarnStackParamList = {
  [AppNavigation.Earn.StakingDuration]: undefined
  [AppNavigation.Earn.GettingStarted]: undefined
}

const EarnStack = createStackNavigator<EarnStackParamList>()

function EarnScreenStack() {
  return (
    <EarnStack.Navigator
      screenOptions={{
        headerShown: true
      }}>
      <EarnStack.Screen
        name={AppNavigation.Earn.StakingDuration}
        component={StakingDuration}
        options={{
          header: TopNavigation
        }}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.GettingStarted}
        component={EarnTabView}
        options={{
          header: TopNavigation
        }}
      />
    </EarnStack.Navigator>
  )
}

const TopNavigation = () => <TopNavigationHeader showBackButton />
export default React.memo(EarnScreenStack)
