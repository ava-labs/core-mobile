import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import StakeDetails from 'screens/earn/StakeDetails'
import { StakeDashboard } from 'screens/earn/StakeDashboard'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import ClaimRewards from 'screens/earn/ClaimRewards'
import { FeeUnavailableModal } from 'screens/earn/FeeUnavailableModal'
import { EarnNotificationsModal } from 'screens/earn/EarnNotificationsModal'
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
  [AppNavigation.Earn.ClaimRewards]: undefined
  [AppNavigation.Earn.FeeUnavailable]: undefined
  [AppNavigation.Earn.EarnNotificationsPrompt]: undefined
}

const EarnStack = createStackNavigator<EarnStackParamList>()

function EarnScreenStack() {
  return (
    <EarnStack.Navigator
      screenOptions={{
        headerShown: true,
        title: '',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerLeftContainerStyle: {
          paddingLeft: 8
        }
      }}>
      <EarnStack.Screen
        name={AppNavigation.Earn.StakeDashboard}
        options={{
          header: NavigationHeader
        }}
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
      <EarnStack.Screen
        name={AppNavigation.Earn.ClaimRewards}
        component={ClaimRewards}
      />

      <EarnStack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.Earn.FeeUnavailable}
        component={FeeUnavailableModal}
      />

      <EarnStack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.Earn.EarnNotificationsPrompt}
        component={EarnNotificationsModal}
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
