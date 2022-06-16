import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import Welcome from 'screens/onboarding/Welcome'
import { noop } from 'rxjs'
import {
  useNavigation,
  useRoute,
  NavigatorScreenParams
} from '@react-navigation/native'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import { createStackNavigator } from '@react-navigation/stack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AnalyticsConsent from 'screens/onboarding/AnalyticsConsent'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { useDispatch } from 'react-redux'
import { onAppUnlocked } from 'store/app'
import { WelcomeScreenProps } from '../types'
import CreateWalletStack, {
  CreateWalletStackParamList
} from './CreateWalletStack'
import EnterWithMnemonicStack, {
  EnterWithMnemonicStackParamList
} from './EnterWithMnemonicStack'

export type WelcomeScreenStackParamList = {
  [AppNavigation.Onboard.Welcome]: undefined
  [AppNavigation.Onboard.AnalyticsConsent]: {
    nextScreen:
      | typeof AppNavigation.Onboard.CreateWalletStack
      | typeof AppNavigation.Onboard.EnterWithMnemonicStack
  }
  [AppNavigation.Onboard.CreateWalletStack]:
    | NavigatorScreenParams<CreateWalletStackParamList>
    | undefined
  [AppNavigation.Onboard.EnterWithMnemonicStack]:
    | NavigatorScreenParams<EnterWithMnemonicStackParamList>
    | undefined
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

type WelcomeScreenNavigationProp = WelcomeScreenProps<
  typeof AppNavigation.Onboard.Welcome
>['navigation']

const WelcomeScreen = () => {
  const { navigate } = useNavigation<WelcomeScreenNavigationProp>()
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
  const dispatch = useDispatch()

  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() => goBack()}
      onLoginSuccess={mnemonic => {
        enterWallet(mnemonic)
        dispatch(onAppUnlocked())
      }}
    />
  )
}

type AnalyticsConsentScreenProps = WelcomeScreenProps<
  typeof AppNavigation.Onboard.AnalyticsConsent
>

const AnalyticsConsentScreen = () => {
  const { goBack, navigate } =
    useNavigation<AnalyticsConsentScreenProps['navigation']>()
  const { params } = useRoute<AnalyticsConsentScreenProps['route']>()

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
