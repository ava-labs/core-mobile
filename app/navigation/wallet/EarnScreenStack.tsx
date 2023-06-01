import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import GetStarted from 'screens/earn/GetStarted'
import StakingAmount from 'screens/earn/StakingAmount'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import StakingDuration from 'screens/earn/DurationScreen'

export type EarnStackParamList = {
  [AppNavigation.Earn.GetStarted]: undefined
  [AppNavigation.Earn.StakingAmount]: undefined
  [AppNavigation.Earn.StakingDuration]: undefined
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
        options={{
          header: TopNavigation
        }}
      />
    </EarnStack.Navigator>
  )
}
const TopNavigation = () => <TopNavigationHeader showBackButton />

type EarnProps = EarnScreenProps<typeof AppNavigation.Earn.GetStarted>

const EarnGetStartedScreen = () => {
  const { navigate } = useNavigation<EarnProps['navigation']>()

  const navToStakingAmount = () => {
    navigate(AppNavigation.Earn.StakingAmount)
  }
  return <GetStarted onNext={navToStakingAmount} />
}

export default React.memo(EarnScreenStack)
