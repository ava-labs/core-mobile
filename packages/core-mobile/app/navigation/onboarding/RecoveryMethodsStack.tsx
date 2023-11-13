import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { AuthenticatorSetup } from 'seedless/screens/AuthenticatorSetup'
import { ScanQrCode } from 'seedless/screens/ScanQrCode'
import { LearnMore } from 'seedless/screens/LearnMore'
import { VerifyCode } from 'seedless/screens/VerifyCode'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { AddRecoveryMethods } from 'seedless/screens/AddRecoveryMethods'

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
