import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { AddRecoveryMethods } from 'screens/onboarding/seedless/AddRecoveryMethods'
import { AuthenticatorSetup } from 'screens/onboarding/seedless/AuthenticatorSetup'
import { ScanQrCode } from 'screens/onboarding/seedless/ScanQrCode'
import { LearnMore } from 'screens/onboarding/seedless/LearnMore'
import { VerifyCode } from 'screens/onboarding/seedless/VerifyCode'
import { MainHeaderOptions } from 'navigation/NavUtils'

export type RecoveryMethodsStackParamList = {
  [AppNavigation.RecoveryMethods.AddRecoveryMethods]: undefined
  [AppNavigation.RecoveryMethods.AuthenticatorSetup]: undefined
  [AppNavigation.RecoveryMethods.ScanQrCode]: undefined
  [AppNavigation.RecoveryMethods.LearnMore]: undefined
  [AppNavigation.RecoveryMethods.VerifyCode]: undefined
}
const RecoveryMethodsS = createStackNavigator<RecoveryMethodsStackParamList>()

const RecoveryMethodsStack = (): JSX.Element => {
  return (
    <RecoveryMethodsS.Navigator screenOptions={{ headerShown: false }}>
      <RecoveryMethodsS.Screen
        options={MainHeaderOptions()}
        name={AppNavigation.RecoveryMethods.AddRecoveryMethods}
        component={AddRecoveryMethods}
      />
      <RecoveryMethodsS.Screen
        options={MainHeaderOptions()}
        name={AppNavigation.RecoveryMethods.AuthenticatorSetup}
        component={AuthenticatorSetup}
      />
      <RecoveryMethodsS.Screen
        options={MainHeaderOptions()}
        name={AppNavigation.RecoveryMethods.ScanQrCode}
        component={ScanQrCode}
      />
      <RecoveryMethodsS.Screen
        options={MainHeaderOptions()}
        name={AppNavigation.RecoveryMethods.LearnMore}
        component={LearnMore}
      />
      <RecoveryMethodsS.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.RecoveryMethods.VerifyCode}
        component={VerifyCode}
      />
    </RecoveryMethodsS.Navigator>
  )
}

export default RecoveryMethodsStack
