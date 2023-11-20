import React from 'react'
import { View } from 'react-native'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import Logger from 'utils/Logger'
import { useWallet } from 'hooks/useWallet'
import { resetNavToEnterMnemonic } from 'utils/Navigation'

export function PinScreen(): JSX.Element {
  const { initWallet } = useWallet()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute'
      }}>
      <PinOrBiometryLogin
        onSignInWithRecoveryPhrase={() => resetNavToEnterMnemonic()}
        onLoginSuccess={mnemonic => {
          initWallet(mnemonic).catch(Logger.error)
        }}
      />
    </View>
  )
}
