import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import StakeDetails from 'screens/earn/StakeDetails'
import { StakeDashboard } from 'screens/earn/StakeDashboard'
import StakeSetupScreenStack, {
  StakeSetupStackParamList
} from './StakeSetupScreenStack'

export type EarnStackParamList = {
  [AppNavigation.Earn.StakeDashboard]: undefined
  [AppNavigation.Earn
    .StakeSetup]: NavigatorScreenParams<StakeSetupStackParamList>
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
        options={{ headerShown: false }}
        component={StakeDashboard}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakeSetup}
        options={{ headerShown: false }}
        component={StakeSetupScreenStack}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakeDetails}
        component={StakeDetails}
      />
    </EarnStack.Navigator>
  )
}

export default React.memo(EarnScreenStack)
