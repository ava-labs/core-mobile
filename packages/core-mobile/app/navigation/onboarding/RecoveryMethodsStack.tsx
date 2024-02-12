import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { AddRecoveryMethods } from 'seedless/screens/AddRecoveryMethods'
import { MFA } from 'seedless/types'
import { FIDONameInputScreen } from 'seedless/screens/FIDONameInputScreen'
import { TotpChallenge } from '@cubist-labs/cubesigner-sdk'
import { AuthenticatorSetupScreen } from 'seedless/screens/AuthenticatorSetupScreen'
import { ScanQrCodeScreen } from 'seedless/screens/ScanQrCodeScreen'
import { LearnMoreScreen } from 'seedless/screens/LearnMoreScreen'

export type RecoveryMethodsStackParamList = {
  [AppNavigation.RecoveryMethods.AddRecoveryMethods]: {
    oidcAuth?: { oidcToken: string; mfaId: string }
    mfas?: MFA[]
    onAccountVerified: (withMfa: boolean) => void
  }
  [AppNavigation.RecoveryMethods.AuthenticatorSetup]: {
    oidcAuth?: { oidcToken: string; mfaId: string }
    onAccountVerified: (withMfa: boolean) => void
  }
  [AppNavigation.RecoveryMethods.ScanQrCode]: {
    oidcAuth?: { oidcToken: string; mfaId: string }
    totpChallenge: TotpChallenge
    onAccountVerified: (withMfa: boolean) => void
  }
  [AppNavigation.RecoveryMethods.LearnMore]: { totpKey: string }
  [AppNavigation.RecoveryMethods.FIDONameInput]: {
    title: string
    description: string
    inputFieldLabel: string
    inputFieldPlaceholder: string
    onClose: (name?: string) => Promise<void>
  }
}

const RecoveryMethodsS = createStackNavigator<RecoveryMethodsStackParamList>()

const RecoveryMethodsStack = (): JSX.Element => {
  return (
    <RecoveryMethodsS.Navigator>
      <RecoveryMethodsS.Screen
        options={MainHeaderOptions()}
        name={AppNavigation.RecoveryMethods.AddRecoveryMethods}
        component={AddRecoveryMethods}
      />
      <RecoveryMethodsS.Group>
        {/* Screens for authenticator setup */}
        <RecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryMethods.AuthenticatorSetup}
          component={AuthenticatorSetupScreen}
        />
        <RecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryMethods.ScanQrCode}
          component={ScanQrCodeScreen}
        />
        <RecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryMethods.LearnMore}
          component={LearnMoreScreen}
        />
      </RecoveryMethodsS.Group>
      <RecoveryMethodsS.Group>
        <RecoveryMethodsS.Screen
          options={{ presentation: 'modal' }}
          name={AppNavigation.RecoveryMethods.FIDONameInput}
          component={FIDONameInputScreen}
        />
      </RecoveryMethodsS.Group>
    </RecoveryMethodsS.Navigator>
  )
}

export default RecoveryMethodsStack
