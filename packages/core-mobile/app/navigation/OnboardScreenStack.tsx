import React, { FC } from 'react'
import AppNavigation from 'navigation/AppNavigation'
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

export const OnboardScreenStack: FC = () => {
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
    </OnboardingScreenS.Navigator>
  )
}
