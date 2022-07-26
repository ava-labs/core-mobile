import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import WelcomeScreenStack from 'navigation/onboarding/WelcomeScreenStack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import { View } from 'react-native'
import { WelcomeScreenStackParamList } from './onboarding/WelcomeScreenStack'

export type OnboardingScreenStackParamList = {
  [AppNavigation.Onboard.Init]: undefined
  [AppNavigation.Root
    .Welcome]: NavigatorScreenParams<WelcomeScreenStackParamList>
}

const OnboardingScreenS = createStackNavigator<OnboardingScreenStackParamList>()

export const OnboardScreenStack = () => {
  const { theme } = useApplicationContext()

  return (
    <OnboardingScreenS.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colorBg2 }
      }}>
      <OnboardingScreenS.Screen
        name={AppNavigation.Onboard.Init}
        component={View}
      />
      <OnboardingScreenS.Screen
        name={AppNavigation.Root.Welcome}
        component={WelcomeScreenStack}
      />
    </OnboardingScreenS.Navigator>
  )
}
