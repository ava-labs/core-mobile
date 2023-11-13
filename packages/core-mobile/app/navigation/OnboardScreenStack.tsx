import React, { FC, useEffect, useRef } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import WelcomeScreenStack from 'navigation/onboarding/WelcomeScreenStack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams, useNavigation } from '@react-navigation/native'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { WalletState, selectIsLocked, selectWalletState } from 'store/app'
import { useSelector } from 'react-redux'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import SignupScreen from './onboarding/SignupScreen'
import { WelcomeScreenStackParamList } from './onboarding/WelcomeScreenStack'
import { OnboardScreenProps } from './types'
import SigninScreen from './onboarding/SigninScreen'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

const OnboardScreenStack: FC = () => {
  const { theme } = useApplicationContext()
  const { pendingDeepLink } = useDeeplink()
  const walletState = useSelector(selectWalletState)
  const isLocked = useSelector(selectIsLocked)
  const { appNavHook } = useApplicationContext()
  const navigation = useNavigation<NavigationProp>()
  const welcomeScreenStackTransitionAnimationEnabled = useRef(true)

  useEffect(() => {
    if (pendingDeepLink && walletState === WalletState.NONEXISTENT) {
      showSnackBarCustom({
        component: (
          <GeneralToast
            message={`No wallet found. Create or add a wallet to Core to connect to applications.`}
          />
        ),
        duration: 'short'
      })
    }
  }, [appNavHook?.navigation, isLocked, pendingDeepLink, walletState])

  useEffect(() => {
    if (isLocked && walletState !== WalletState.NONEXISTENT) {
      welcomeScreenStackTransitionAnimationEnabled.current = false
      navigation.replace(AppNavigation.Onboard.Welcome, {
        screen: AppNavigation.Onboard.Login
      })
    }
  }, [navigation, isLocked, walletState])

  return (
    <OnboardingScreenS.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colorBg2 }
      }}>
      <OnboardingScreenS.Screen
        name={AppNavigation.Onboard.Signup}
        component={SignupScreen}
      />
      <OnboardingScreenS.Screen
        name={AppNavigation.Onboard.Signin}
        component={SigninScreen}
      />
      <OnboardingScreenS.Screen
        name={AppNavigation.Onboard.Welcome}
        component={WelcomeScreenStack}
        options={{
          animationEnabled: welcomeScreenStackTransitionAnimationEnabled.current
        }}
      />
    </OnboardingScreenS.Navigator>
  )
}

export type OnboardingScreenStackParamList = {
  [AppNavigation.Onboard.Signup]: undefined
  [AppNavigation.Onboard.Signin]: undefined
  [AppNavigation.Onboard
    .Welcome]: NavigatorScreenParams<WelcomeScreenStackParamList>
}

const OnboardingScreenS = createStackNavigator<OnboardingScreenStackParamList>()

export default OnboardScreenStack
