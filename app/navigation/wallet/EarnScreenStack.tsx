import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import StakeDetails from 'screens/earn/StakeDetails'
import { StakeDashboard } from 'screens/earn/StakeDashboard'
import TopNavigationHeader from 'navigation/TopNavigationHeader'

export type EarnStackParamList = {
  [AppNavigation.Earn.StakeDashboard]: undefined
  [AppNavigation.Earn.StakeDetails]: {
    txHash: string
    stakeTitle: string
  }
}

const EarnStack = createStackNavigator<EarnStackParamList>()

function EarnScreenStack() {
  return (
    <EarnStack.Navigator
      screenOptions={{
        headerShown: true,
        title: '',
        headerBackTitleVisible: false
      }}>
      <EarnStack.Screen
        name={AppNavigation.Earn.StakeDashboard}
        options={{
          header: NavigationHeader
        }}
        component={StakeDashboard}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakeDetails}
        component={StakeDetails}
      />
    </EarnStack.Navigator>
  )
}

const NavigationHeader = () => (
  <TopNavigationHeader
    showAccountSelector={false}
    showNetworkSelector={false}
  />
)

export default React.memo(EarnScreenStack)
