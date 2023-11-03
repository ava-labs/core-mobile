import AppNavigation from 'navigation/AppNavigation'
import React, { FC } from 'react'
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
import { useDispatch } from 'react-redux'
import { onAppUnlocked } from 'store/app'
import Logger from 'utils/Logger'
import CreateSeedlessWalletStack from 'seedless/screens/CreateSeedlessWalletStack'
import DummyOnboardingScreen from 'seedless/screens/DummyOnboardingScreen'
import { SignerSessionData } from '@cubist-dev/cubesigner-sdk'
import { WelcomeScreenProps } from '../types'
import CreateWalletStack, {
  CreateWalletStackParamList
} from './CreateWalletStack'
import EnterWithMnemonicStack, {
  EnterWithMnemonicStackParamList
} from './EnterWithMnemonicStack'

export type WelcomeScreenStackParamList = {
  [AppNavigation.Onboard.AnalyticsConsent]: {
    nextScreen:
      | typeof AppNavigation.Onboard.CreateWalletStack
      | typeof AppNavigation.Onboard.EnterWithMnemonicStack
  }
  [AppNavigation.Onboard.CreateWalletStack]:
    | NavigatorScreenParams<CreateWalletStackParamList>
    | undefined
  [AppNavigation.Onboard.Dummy]: undefined
  [AppNavigation.Onboard.CreateSeedlessWalletStack]: {
    signerSessionData: SignerSessionData
  }
  [AppNavigation.Onboard.EnterWithMnemonicStack]:
    | NavigatorScreenParams<EnterWithMnemonicStackParamList>
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
      options={MainHeaderOptions()}
      name={AppNavigation.Onboard.Dummy}
      component={DummyOnboardingScreen}
    />
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.CreateSeedlessWalletStack}
      component={CreateSeedlessWalletStack}
    />
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.EnterWithMnemonicStack}
      component={EnterWithMnemonicStack}
    />
  </WelcomeScreenS.Navigator>
)

const LoginWithPinOrBiometryScreen: FC = () => {
  const context = useApplicationContext()
  const { enterWallet } = context.walletSetupHook
  const dispatch = useDispatch()

  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() =>
        context.appNavHook.resetNavToEnterMnemonic()
      }
      onLoginSuccess={mnemonic => {
        enterWallet(mnemonic)
          .then(() => {
            dispatch(onAppUnlocked())
          })
          .catch(Logger.error)
      }}
    />
  )
}

type AnalyticsConsentScreenProps = WelcomeScreenProps<
  typeof AppNavigation.Onboard.AnalyticsConsent
>

const AnalyticsConsentScreen: FC = () => {
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
