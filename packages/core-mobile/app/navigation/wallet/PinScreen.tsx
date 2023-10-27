import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { View } from 'react-native'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import Logger from 'utils/Logger'
import { useWalletSetup } from 'hooks/useWalletSetup'

export function PinScreen(): JSX.Element {
  const { appNavHook } = useApplicationContext()
  const { enterWallet } = useWalletSetup(appNavHook)

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute'
      }}>
      <PinOrBiometryLogin
        onSignInWithRecoveryPhrase={() => appNavHook.resetNavToEnterMnemonic()}
        onLoginSuccess={mnemonic => {
          enterWallet(mnemonic).catch(reason => Logger.error(reason))
        }}
      />
    </View>
  )
}
