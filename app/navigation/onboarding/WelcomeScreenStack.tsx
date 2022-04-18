import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import Welcome from 'screens/onboarding/Welcome'
import { noop } from 'rxjs'
import CreateWalletStack from 'navigation/onboarding/CreateWalletStack'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import EnterWithMnemonicStack from 'navigation/onboarding/EnterWithMnemonicStack'
import {
  createStackNavigator,
  StackNavigationProp
} from '@react-navigation/stack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AnalyticsConsent from 'screens/onboarding/AnalyticsConsent'
import { MainHeaderOptions } from 'navigation/NavUtils'

type WelcomeScreenStackParamList = {
  [AppNavigation.Onboard.Welcome]: undefined
  [AppNavigation.Onboard.AnalyticsConsent]: {
    nextScreen:
      | typeof AppNavigation.Onboard.CreateWalletStack
      | typeof AppNavigation.Onboard.EnterWithMnemonicStack
  }
  [AppNavigation.Onboard.CreateWalletStack]: undefined
  [AppNavigation.Onboard.EnterWithMnemonicStack]: undefined
  [AppNavigation.Onboard.Login]: undefined
}
const WelcomeScreenS = createStackNavigator<WelcomeScreenStackParamList>()

const WelcomeScreenStack: () => JSX.Element = () => (
  <WelcomeScreenS.Navigator screenOptions={{ headerShown: false }}>
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.Welcome}
      component={WelcomeScreen}
    />
    <WelcomeScreenS.Screen
      options={MainHeaderOptions('')}
      name={AppNavigation.Onboard.AnalyticsConsent}
      component={AnalyticsConsentScreen}
    />
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.CreateWalletStack}
      component={CreateWalletStack}
    />
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.EnterWithMnemonicStack}
      component={EnterWithMnemonicStack}
    />
    <WelcomeScreenS.Screen
      options={{ presentation: 'modal' }}
      name={AppNavigation.Onboard.Login}
      component={LoginWithPinOrBiometryScreen}
    />
  </WelcomeScreenS.Navigator>
)

const WelcomeScreen = () => {
  const { navigate } =
    useNavigation<StackNavigationProp<WelcomeScreenStackParamList>>()
  return (
    <Welcome
      onAlreadyHaveWallet={() =>
        navigate(AppNavigation.Onboard.AnalyticsConsent, {
          nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
        })
      }
      onCreateWallet={() =>
        navigate(AppNavigation.Onboard.AnalyticsConsent, {
          nextScreen: AppNavigation.Onboard.CreateWalletStack
        })
      }
      onEnterWallet={() => noop}
    />
  )
}

const LoginWithPinOrBiometryScreen = () => {
  const { enterWallet } = useApplicationContext().walletSetupHook
  const { goBack } = useNavigation()
  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() => goBack()}
      onLoginSuccess={mnemonic => {
        enterWallet(mnemonic)
      }}
    />
  )
}

const AnalyticsConsentScreen = () => {
  const { goBack, navigate } =
    useNavigation<StackNavigationProp<WelcomeScreenStackParamList>>()
  const { params } =
    useRoute<
      RouteProp<
        WelcomeScreenStackParamList,
        typeof AppNavigation.Onboard.AnalyticsConsent
      >
    >()

  return (
    <AnalyticsConsent
      nextScreen={params.nextScreen}
      onNextScreen={(
        screen:
          | typeof AppNavigation.Onboard.CreateWalletStack
          | typeof AppNavigation.Onboard.EnterWithMnemonicStack
      ) => {
        goBack() //remove this screen from stack so we cant go back to it with back btns
        navigate(screen)
      }}
    />
  )
}
export default WelcomeScreenStack
