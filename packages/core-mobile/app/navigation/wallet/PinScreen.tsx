import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import { onAppUnlocked } from 'store/app'

export function PinScreen() {
  const dispatch = useDispatch()
  const { appNavHook } = useApplicationContext()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute'
      }}>
      <PinOrBiometryLogin
        onSignInWithRecoveryPhrase={() => appNavHook.resetNavToEnterMnemonic()}
        onLoginSuccess={() => {
          dispatch(onAppUnlocked())
        }}
      />
    </View>
  )
}
