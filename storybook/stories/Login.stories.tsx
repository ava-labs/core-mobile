import React from 'react'
import { type Meta } from '@storybook/react-native'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import Logger from 'utils/Logger'

export default {
  title: 'Login'
} as Meta

export const BiometricLoginScreen = () => {
  return (
    <BiometricLogin
      mnemonic={'test nemnic'}
      onBiometrySet={() => {
        Logger.trace('onBiometrySet')
      }}
      onSkip={() => {
        Logger.trace('onSkip')
      }}
    />
  )
}
