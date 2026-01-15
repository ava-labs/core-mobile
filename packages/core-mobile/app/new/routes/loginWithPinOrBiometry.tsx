import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import BiometricsSDK from 'utils/BiometricsSDK'
import { PinScreen } from '../common/components/PinScreen'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const router = useRouter()

  const handleForgotPin = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/forgotPin')
  }

  const handleBiometricPrompt = useCallback(async () => {
    // Use authenticateAsync() so iOS shows passcode fallback during Face ID lockout
    const authenticated = await BiometricsSDK.authenticateAsync()
    if (!authenticated) return false
    // After successful biometric auth, load the encryption key
    return BiometricsSDK.loadEncryptionKeyWithBiometry()
  }, [])

  return (
    <ScrollScreen
      shouldAvoidKeyboard
      hideHeaderBackground
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <PinScreen
        onForgotPin={handleForgotPin}
        isInitialLogin={true}
        onBiometricPrompt={handleBiometricPrompt}
      />
    </ScrollScreen>
  )
}

export default LoginWithPinOrBiometry
