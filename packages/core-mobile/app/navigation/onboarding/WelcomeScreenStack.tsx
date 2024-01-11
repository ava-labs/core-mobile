import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import {
  NavigatorScreenParams,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import AnalyticsConsent from 'screens/onboarding/AnalyticsConsent'
import { MainHeaderOptions } from 'navigation/NavUtils'
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
}
const WelcomeScreenS = createStackNavigator<WelcomeScreenStackParamList>()

const WelcomeScreenStack: () => JSX.Element = () => (
  <WelcomeScreenS.Navigator screenOptions={{ headerShown: false }}>
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

type AnalyticsConsentScreenProps = WelcomeScreenProps<
  typeof AppNavigation.Onboard.AnalyticsConsent
>

const AnalyticsConsentScreen = (): JSX.Element => {
  const { navigate } =
    useNavigation<AnalyticsConsentScreenProps['navigation']>()
  const { params } = useRoute<AnalyticsConsentScreenProps['route']>()

  function handleDone(): void {
    navigate(params.nextScreen)
  }

  return <AnalyticsConsent title={'Help Us Improve'} onDone={handleDone} />
}

export default WelcomeScreenStack
