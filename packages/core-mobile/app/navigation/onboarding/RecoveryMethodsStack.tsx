import AppNavigation from 'navigation/AppNavigation'
import React, { createContext, useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { AuthenticatorSetup } from 'seedless/screens/AuthenticatorSetup'
import { ScanQrCode } from 'seedless/screens/ScanQrCode'
import { LearnMore } from 'seedless/screens/LearnMore'
import { VerifyCode } from 'seedless/screens/VerifyCode'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { AddRecoveryMethods } from 'seedless/screens/AddRecoveryMethods'
import { useRoute } from '@react-navigation/native'
import { OnboardScreenProps } from 'navigation/types'

export type RecoveryMethodsStackParamList = {
  [AppNavigation.RecoveryMethods.AddRecoveryMethods]: undefined
  [AppNavigation.RecoveryMethods.AuthenticatorSetup]: undefined
  [AppNavigation.RecoveryMethods.ScanQrCode]: undefined
  [AppNavigation.RecoveryMethods.LearnMore]: { totpCode?: string }
  [AppNavigation.RecoveryMethods.VerifyCode]: undefined
}

const RecoveryMethodsS = createStackNavigator<RecoveryMethodsStackParamList>()

type RecoveryMethodsContextState = {
  oidcToken: string
  mfaId: string
}

export const RecoveryMethodsContext = createContext(
  {} as RecoveryMethodsContextState
)

type RecoveryMethodsStackProps = OnboardScreenProps<
  typeof AppNavigation.Onboard.RecoveryMethods
>

const RecoveryMethodsStack = (): JSX.Element => {
  const { params } = useRoute<RecoveryMethodsStackProps['route']>()
  const [oidcToken] = useState(params.oidcToken)
  const [mfaId] = useState(params.mfaId)

  return (
    <RecoveryMethodsContext.Provider value={{ oidcToken, mfaId }}>
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
    </RecoveryMethodsContext.Provider>
  )
}

export default RecoveryMethodsStack
