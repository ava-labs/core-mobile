import { createStackNavigator } from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import React, { useCallback } from 'react'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import { useNavigation } from '@react-navigation/native'
import { setPinRecovery } from 'utils/Navigation'
import { useWallet } from 'hooks/useWallet'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Logger from 'utils/Logger'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { useSelector } from 'react-redux'
import { selectWalletType } from 'store/app'
import ForgotPin from 'screens/mainView/ForgotPin'
import { WalletType } from 'services/wallet/types'

export type LoginScreenStackParams = {
  [AppNavigation.LoginWithMnemonic.PinOrBiometry]: undefined
  [AppNavigation.LoginWithMnemonic.ForgotPin]: undefined
}

const LoginScreenS = createStackNavigator<LoginScreenStackParams>()

export default function LoginScreenStack(): JSX.Element {
  return (
    <LoginScreenS.Navigator
      screenOptions={{
        headerShown: false
      }}>
      <LoginScreenS.Screen
        name={AppNavigation.LoginWithMnemonic.PinOrBiometry}
        component={LoginWithPinOrBiometryScreen}
      />
      <LoginScreenS.Screen
        options={{
          presentation: 'card',
          ...MainHeaderOptions()
        }}
        name={AppNavigation.LoginWithMnemonic.ForgotPin}
        component={ForgotPinScreen}
      />
    </LoginScreenS.Navigator>
  )
}

export const ForgotPinScreen = (): JSX.Element => {
  const { signOut } = useApplicationContext().appHook
  const walletType = useSelector(selectWalletType)

  const handleConfirm = (): void => {
    if (walletType === WalletType.MNEMONIC) {
      signOut()
    } else if (walletType === WalletType.SEEDLESS) {
      setPinRecovery(true)
      signOut()
    }
  }

  return <ForgotPin onConfirm={handleConfirm} />
}

const LoginWithPinOrBiometryScreen = (): JSX.Element => {
  const { unlock } = useWallet()
  const navigation = useNavigation()

  const handleLoginSuccess = useCallback(
    (mnemonic: string) => {
      unlock({ mnemonic }).catch(Logger.error)
    },
    [unlock]
  )
  const handleForgotPin = useCallback(() => {
    // @ts-ignore
    navigation.navigate(AppNavigation.LoginWithMnemonic.ForgotPin)
  }, [navigation])

  return (
    <PinOrBiometryLogin
      onForgotPin={handleForgotPin}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}
