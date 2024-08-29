import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import StakeDetails from 'screens/earn/StakeDetails'
import { StakeDashboard } from 'screens/earn/StakeDashboard'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import ClaimRewards from 'screens/earn/ClaimRewards'
import { FeeUnavailableModal } from 'screens/earn/FeeUnavailableModal'
import * as Navigation from 'utils/Navigation'
import { noop } from '@avalabs/core-utils-sdk'
import { FundsStuckModal } from 'screens/earn/FundsStuckModal'
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
  [AppNavigation.Earn.ClaimRewards]?: { onBack?: () => void }
  [AppNavigation.Earn.FeeUnavailable]: undefined
  [AppNavigation.Earn.FundsStuck]: {
    onTryAgain: () => void
  }
}

const EarnStack = createStackNavigator<EarnStackParamList>()

function EarnScreenStack(): JSX.Element {
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
          header: () => renderNavigationHeader({})
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
        options={{
          header: () =>
            renderNavigationHeader({
              showBackButton: true,
              onBack: () => {
                Navigation.navigate({
                  // @ts-ignore
                  name: AppNavigation.Tabs.Stake
                })
              }
            })
        }}
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
        name={AppNavigation.Earn.FundsStuck}
        component={FundsStuckModal}
      />
    </EarnStack.Navigator>
  )
}

const renderNavigationHeader = ({
  showBackButton = false,
  onBack = noop
}: {
  showBackButton?: boolean
  onBack?: () => void
}): JSX.Element => (
  <TopNavigationHeader
    showAccountSelector={false}
    showNetworkSelector={false}
    showBackButton={showBackButton}
    onBack={onBack}
  />
)

export default React.memo(EarnScreenStack)
