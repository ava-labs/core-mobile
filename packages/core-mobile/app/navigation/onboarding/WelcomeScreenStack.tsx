import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import {
  NavigatorScreenParams,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import { createStackNavigator } from '@react-navigation/stack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AnalyticsConsent from 'screens/onboarding/AnalyticsConsent'
import { MainHeaderOptions } from 'navigation/NavUtils'
import Logger from 'utils/Logger'
import { WelcomeScreenProps } from '../types'
import CreateWalletStack, {
  CreateWalletStackParamList
} from './CreateWalletStack'
import EnterWithMnemonicStack, {
  EnterWithMnemonicStackParamList
} from './EnterWithMnemonicStack'
import CreatePinStack, { CreatePinStackParamList } from './CreatePinStack'

export type WelcomeScreenStackParamList = {
  [AppNavigation.Onboard.AnalyticsConsent]: {
    nextScreen:
      | typeof AppNavigation.Onboard.CreateWalletStack
      | typeof AppNavigation.Onboard.EnterWithMnemonicStack
      | typeof AppNavigation.Onboard.CreatePin
  }
  [AppNavigation.Onboard.CreateWalletStack]:
    | NavigatorScreenParams<CreateWalletStackParamList>
    | undefined
  [AppNavigation.Onboard.EnterWithMnemonicStack]:
    | NavigatorScreenParams<EnterWithMnemonicStackParamList>
    | undefined
  [AppNavigation.Onboard.CreatePin]:
    | NavigatorScreenParams<CreatePinStackParamList>
    | undefined
  [AppNavigation.Onboard.Login]: undefined
}
const WelcomeScreenS = createStackNavigator<WelcomeScreenStackParamList>()

const WelcomeScreenStack: () => JSX.Element = () => (
  <WelcomeScreenS.Navigator screenOptions={{ headerShown: false }}>
    <WelcomeScreenS.Screen
      options={{ presentation: 'modal' }}
      name={AppNavigation.Onboard.Login}
      component={LoginWithPinOrBiometryScreen}
    />
    <WelcomeScreenS.Screen
      options={MainHeaderOptions()}
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
      name={AppNavigation.Onboard.CreatePin}
      component={CreatePinStack}
    />
  </WelcomeScreenS.Navigator>
)

const LoginWithPinOrBiometryScreen = (): JSX.Element => {
  const context = useApplicationContext()
  const { enterWallet } = context.walletSetupHook

  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() =>
        context.appNavHook.resetNavToEnterMnemonic()
      }
      onLoginSuccess={mnemonic => {
        enterWallet(mnemonic).catch(Logger.error)
      }}
    />
  )
}

type AnalyticsConsentScreenProps = WelcomeScreenProps<
  typeof AppNavigation.Onboard.AnalyticsConsent
>

const AnalyticsConsentScreen = (): JSX.Element => {
  const { navigate } =
    useNavigation<AnalyticsConsentScreenProps['navigation']>()
  const { params } = useRoute<AnalyticsConsentScreenProps['route']>()

  return (
    <AnalyticsConsent
      nextScreen={params.nextScreen}
      onNextScreen={screen => {
        navigate(screen)
      }}
    />
  )
}
export default WelcomeScreenStack
