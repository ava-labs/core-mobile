import { createStackNavigator } from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import React from 'react'
import { SettingRecoveryMethodsMFAScreen } from 'seedless/screens/SettingRecoveryMethodsMFAScreen'
import { SettingRecoveryMethodsScreen } from 'seedless/screens/SettingRecoveryMethodsScreen'
import { MFA } from 'seedless/types'
import { SettingAuthenticatorSetupScreen } from 'seedless/screens/SettingAuthenticatorSetupScreen'
import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import { SettingScanQrCodeScreen } from 'seedless/screens/SettingScanQrCodeScreen'
import { SettingLearnMoreScreen } from 'seedless/screens/SettingLearnMoreScreen'
import SettingRecoveryMethodsChangeTotpConfirmationScreen from './SettingRecoveryMethodsChangeTotpConfirmationScreen'
import SettingRecoveryMethodsRemovePasskeyConfirmationScreen from './SettingRecoveryMethodsRemovePasskeyConfirmationScreen'

export type SettingRecoveryMethodsStackParamList = {
  [AppNavigation.SettingRecoveryMethods.SettingRecoveryMethods]: undefined
  [AppNavigation.SettingRecoveryMethods.SettingMFA]: {
    mfa: MFA
    canRemove: boolean
  }
  [AppNavigation.SettingRecoveryMethods.SettingAuthenticatorSetup]: {
    totpChallenge: TotpChallenge
  }
  [AppNavigation.SettingRecoveryMethods.SettingScanQrCode]: {
    totpChallenge: TotpChallenge
  }
  [AppNavigation.SettingRecoveryMethods.SettingLearnMore]: { totpKey: string }
  [AppNavigation.SettingRecoveryMethods.ChangeTotpConfirmation]: undefined
  [AppNavigation.SettingRecoveryMethods.RemovePasskeyConfirmation]: {
    fidoId: string
  }
}

const SettingRecoveryMethodsS =
  createStackNavigator<SettingRecoveryMethodsStackParamList>()

const SettingRecoveryMethodsStack = (): JSX.Element => {
  return (
    <SettingRecoveryMethodsS.Navigator
      screenOptions={MainHeaderOptions({ title: 'Recovery Methods' })}>
      <SettingRecoveryMethodsS.Screen
        name={AppNavigation.SettingRecoveryMethods.SettingRecoveryMethods}
        component={SettingRecoveryMethodsScreen}
      />
      <SettingRecoveryMethodsS.Screen
        name={AppNavigation.SettingRecoveryMethods.SettingMFA}
        component={SettingRecoveryMethodsMFAScreen}
        options={MainHeaderOptions()}
      />
      <SettingRecoveryMethodsS.Group>
        {/* Screens for authenticator setup */}
        <SettingRecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SettingRecoveryMethods.SettingAuthenticatorSetup}
          component={SettingAuthenticatorSetupScreen}
        />
        <SettingRecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SettingRecoveryMethods.SettingScanQrCode}
          component={SettingScanQrCodeScreen}
        />
        <SettingRecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.SettingRecoveryMethods.SettingLearnMore}
          component={SettingLearnMoreScreen}
        />
        <SettingRecoveryMethodsS.Screen
          options={{ presentation: 'transparentModal', headerShown: false }}
          name={AppNavigation.SettingRecoveryMethods.ChangeTotpConfirmation}
          component={SettingRecoveryMethodsChangeTotpConfirmationScreen}
        />
        <SettingRecoveryMethodsS.Screen
          options={{ presentation: 'transparentModal', headerShown: false }}
          name={AppNavigation.SettingRecoveryMethods.RemovePasskeyConfirmation}
          component={SettingRecoveryMethodsRemovePasskeyConfirmationScreen}
        />
      </SettingRecoveryMethodsS.Group>
    </SettingRecoveryMethodsS.Navigator>
  )
}

export default SettingRecoveryMethodsStack
