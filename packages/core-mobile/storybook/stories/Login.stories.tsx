import React from 'react'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import Logger from 'utils/Logger'

export default {
  title: 'Login'
}

export const BiometricLoginScreen = (): React.JSX.Element => {
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
