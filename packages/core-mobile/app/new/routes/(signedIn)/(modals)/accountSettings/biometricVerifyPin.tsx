import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import React from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const BiometricVerifyPinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()

  const handleLoginSuccess = (): void => {
    BiometricsSDK.enableBiometry()
      .then(() => canGoBack() && back())
      .catch(Logger.error)
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleLoginSuccess} />
}
export default BiometricVerifyPinScreen
