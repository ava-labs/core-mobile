import React, { FC, useEffect } from 'react'
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

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Init
>['navigation']

const OnboardScreenStack: FC = () => {
  const { theme } = useApplicationContext()
  const { pendingDeepLink } = useDeeplink()
  const walletState = useSelector(selectWalletState)
  const isLocked = useSelector(selectIsLocked)
  const { appNavHook } = useApplicationContext()
  const navigation = useNavigation<NavigationProp>()

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
      navigation.navigate(AppNavigation.Root.Welcome, {
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
        name={AppNavigation.Onboard.Init}
        component={SignupScreen}
      />
      <OnboardingScreenS.Screen
        name={AppNavigation.Root.Welcome}
        component={WelcomeScreenStack}
      />
    </OnboardingScreenS.Navigator>
  )
}

export type OnboardingScreenStackParamList = {
  [AppNavigation.Onboard.Init]: undefined
  [AppNavigation.Root
    .Welcome]: NavigatorScreenParams<WelcomeScreenStackParamList>
}

const OnboardingScreenS = createStackNavigator<OnboardingScreenStackParamList>()

export default OnboardScreenStack
