import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import BiometricsSDK from 'utils/BiometricsSDK'
import { PinScreen } from '../common/components/PinScreen'
import { markTTIFinal } from '../../../PerformanceTracer'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const router = useRouter()

  const handleForgotPin = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/forgotPin')
  }

  const handleBiometricPrompt = useCallback(async () => {
    return BiometricsSDK.loadEncryptionKeyWithBiometry()
  }, [])

  return (
    <ScrollScreen
      onLayout={() => {markTTIFinal()}}
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
