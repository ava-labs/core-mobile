import React from 'react'
import { HeaderBackButton } from '@react-navigation/elements'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import GetStarted from 'screens/earn/GetStarted'
import StakingAmount from 'screens/earn/StakingAmount'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import StakingDuration from 'screens/earn/DurationScreen'
import { NodeSearch } from 'screens/earn/NodeSearch'
import { Confirmation } from 'screens/earn/Confirmation'
import { CancelModal } from 'screens/earn/CancelModal'

export type EarnStackParamList = {
  [AppNavigation.Earn.GetStarted]: undefined
  [AppNavigation.Earn.StakingAmount]: undefined
  [AppNavigation.Earn.StakingDuration]: undefined
  [AppNavigation.Earn.NodeSearch]: undefined
  [AppNavigation.Earn.Confirmation]: undefined
  [AppNavigation.Earn.Cancel]: undefined
}

const EarnStack = createStackNavigator<EarnStackParamList>()

function EarnScreenStack() {
  return (
    <EarnStack.Navigator
      screenOptions={{
        presentation: 'card',
        headerShown: true,
        title: '',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center'
      }}>
      <EarnStack.Screen
        name={AppNavigation.Earn.GetStarted}
        component={EarnGetStartedScreen}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakingAmount}
        component={StakingAmount}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakingDuration}
        component={StakingDuration}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.NodeSearch}
        component={NodeSearch}
        options={{
          headerShown: false
        }}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.Confirmation}
        component={Confirmation}
        options={{
          headerLeft: ConfirmationBackButton
        }}
      />
      <EarnStack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.Earn.Cancel}
        component={CancelModal}
      />
    </EarnStack.Navigator>
  )
}

type EarnProps = EarnScreenProps<typeof AppNavigation.Earn.GetStarted>

const EarnGetStartedScreen = () => {
  const { navigate } = useNavigation<EarnProps['navigation']>()

  const navToStakingAmount = () => {
    navigate(AppNavigation.Earn.StakingAmount)
  }
  return <GetStarted onNext={navToStakingAmount} />
}

type ConfirmationNavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.Confirmation
>['navigation']

const ConfirmationBackButton = () => {
  const { navigate } = useNavigation<ConfirmationNavigationProp>()

  return (
    <HeaderBackButton
      onPress={() => navigate(AppNavigation.Earn.StakingAmount)}
    />
  )
}

export default React.memo(EarnScreenStack)
